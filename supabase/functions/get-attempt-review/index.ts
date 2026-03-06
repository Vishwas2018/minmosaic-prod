import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SnapshotRow {
  item_snapshot_id: string;
  position: number;
  question_type: string;
  item_code: string;
  stem: Record<string, unknown>;
  stimulus?: Record<string, unknown> | null;
  interaction_config: Record<string, unknown>;
  source_item_id?: string;
}

interface AttemptItemResultRow {
  item_snapshot_id: string;
  is_correct: boolean;
}

interface ScoringConfigRow {
  item_id: string;
  correct_response: Record<string, unknown>;
  scoring_rules: Record<string, unknown> | null;
}

interface ItemExplanationRow {
  id: string;
  explanation: Record<string, unknown> | null;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const correlationId = crypto.randomUUID();

  try {
    if (req.method !== 'GET') {
      return errorResponse('INVALID_REQUEST', 'Method not allowed', correlationId);
    }

    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', correlationId);
    }

    const url = new URL(req.url);
    const attemptId = url.searchParams.get('attempt_id');
    if (!isUuid(attemptId)) {
      return errorResponse(
        'INVALID_REQUEST',
        'attempt_id query param must be a valid UUID',
        correlationId,
      );
    }

    const db = createServiceClient();

    const { data: attempt, error: attemptError } = await db
      .from('attempts')
      .select('id, status')
      .eq('id', attemptId)
      .eq('user_id', auth.user.id)
      .single();

    if (attemptError || !attempt) {
      return errorResponse('ATTEMPT_NOT_FOUND', 'Attempt not found', correlationId);
    }

    if (attempt.status !== 'scored') {
      return errorResponse(
        'INVALID_TRANSITION',
        'Review is only available for scored attempts.',
        correlationId,
      );
    }

    const [{ data: snapshotRecord, error: snapshotError }, { data: itemResults, error: itemResultsError }] =
      await Promise.all([
        db.from('attempt_snapshots').select('snapshot_data').eq('attempt_id', attemptId).single(),
        db
          .from('attempt_item_results')
          .select('item_snapshot_id, is_correct')
          .eq('attempt_id', attemptId),
      ]);

    if (snapshotError || !snapshotRecord) {
      return errorResponse('SERVER_ERROR', 'Failed to load snapshot review data', correlationId);
    }

    if (itemResultsError) {
      return errorResponse('SERVER_ERROR', 'Failed to load per-question results', correlationId);
    }

    const snapshotRows = Array.isArray(snapshotRecord.snapshot_data)
      ? (snapshotRecord.snapshot_data as SnapshotRow[])
      : [];
    const resultMap = new Map(
      ((itemResults ?? []) as AttemptItemResultRow[]).map((row) => [row.item_snapshot_id, row]),
    );

    const sourceItemIds = snapshotRows
      .map((row) => row.source_item_id)
      .filter((value): value is string => typeof value === 'string' && isUuid(value));

    const { data: scoringRows, error: scoringError } = await db
      .from('item_scoring_config')
      .select('item_id, correct_response, scoring_rules')
      .in('item_id', sourceItemIds);

    if (scoringError) {
      return errorResponse('SERVER_ERROR', 'Failed to load review answers', correlationId);
    }

    const { data: itemRows, error: itemError } = await db
      .from('items')
      .select('id, explanation')
      .in('id', sourceItemIds);

    if (itemError) {
      return errorResponse('SERVER_ERROR', 'Failed to load review explanations', correlationId);
    }

    const scoringMap = new Map(
      ((scoringRows ?? []) as ScoringConfigRow[]).map((row) => [row.item_id, row]),
    );
    const itemMap = new Map(
      ((itemRows ?? []) as ItemExplanationRow[]).map((row) => [row.id, row]),
    );

    const reviewItems = snapshotRows
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => {
        const scoring = item.source_item_id ? scoringMap.get(item.source_item_id) : null;
        const itemResult = resultMap.get(item.item_snapshot_id);
        const correctAnswer = scoring
          ? buildCorrectAnswer(item.question_type, item.interaction_config, scoring.correct_response)
          : null;

        return {
          item_snapshot_id: item.item_snapshot_id,
          position: item.position,
          item_code: item.item_code,
          question_type: item.question_type,
          stem: item.stem,
          is_correct: Boolean(itemResult?.is_correct),
          correct_answer: correctAnswer,
          explanation:
            getAuthoredExplanation(item.source_item_id ? itemMap.get(item.source_item_id) : null) ??
            buildExplanation(item.question_type, correctAnswer, scoring?.scoring_rules ?? null),
        };
      });

    return successResponse({ items: reviewItems }, correlationId);
  } catch (error) {
    console.error('Unhandled error in get-attempt-review:', error);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function buildCorrectAnswer(
  questionType: string,
  interactionConfig: Record<string, unknown>,
  correctResponse: Record<string, unknown>,
) {
  switch (questionType) {
    case 'mcq': {
      const optionId = typeof correctResponse.correct_option_id === 'string'
        ? correctResponse.correct_option_id
        : null;
      const optionLabel = optionId ? getOptionLabel(interactionConfig, optionId) : null;
      return optionLabel ? optionLabel : optionId;
    }
    case 'multi_select': {
      const ids = Array.isArray(correctResponse.correct_option_ids)
        ? correctResponse.correct_option_ids.filter((value): value is string => typeof value === 'string')
        : [];
      const labels = ids.map((id) => getOptionLabel(interactionConfig, id) ?? id);
      return labels.join(', ');
    }
    case 'short_text':
      return typeof correctResponse.text === 'string' ? correctResponse.text : null;
    case 'numeric':
      return correctResponse.value != null ? String(correctResponse.value) : null;
    default:
      return null;
  }
}

function getOptionLabel(interactionConfig: Record<string, unknown>, optionId: string) {
  const options = interactionConfig.options;
  if (!Array.isArray(options)) {
    return null;
  }

  for (const option of options) {
    if (!option || typeof option !== 'object') {
      continue;
    }

    const record = option as Record<string, unknown>;
    if (record.id === optionId && typeof record.label === 'string') {
      return record.label;
    }
  }

  return null;
}

function buildExplanation(
  questionType: string,
  correctAnswer: string | null,
  scoringRules: Record<string, unknown> | null,
) {
  if (!correctAnswer) {
    return 'Review details are not available for this question yet.';
  }

  switch (questionType) {
    case 'mcq':
      return `The correct option is "${correctAnswer}" because it matches the question requirements.`;
    case 'multi_select':
      return `The correct selections are ${correctAnswer}. All required choices must be selected for full credit.`;
    case 'short_text':
      return `The expected response is "${correctAnswer}". Your answer is marked correct when it matches after normalising case and spacing.`;
    case 'numeric': {
      const tolerance = scoringRules?.tolerance;
      const toleranceSuffix =
        typeof tolerance === 'number' && tolerance > 0
          ? ` Answers within ${tolerance} are accepted.`
          : '';
      return `The correct value is ${correctAnswer}.${toleranceSuffix}`;
    }
    default:
      return `The correct answer is ${correctAnswer}.`;
  }
}

function getAuthoredExplanation(item: ItemExplanationRow | null | undefined) {
  const explanation = item?.explanation;
  if (!explanation || typeof explanation !== 'object') {
    return null;
  }

  return typeof explanation.text === 'string' ? explanation.text : null;
}

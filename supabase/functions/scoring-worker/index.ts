// supabase/functions/scoring-worker/index.ts
// Step 1.6 - scoring worker
//
// Picks one pending scoring job and computes objective results.
// See spec §4 (finalization), §5 (async scoring), §19 Step 1.6.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { handleCors } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonRecord = Record<string, unknown>;

interface ScoringJob {
  id: string;
  attempt_id: string;
  idempotency_key: string;
  job_type: 'objective' | 'writing';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead';
  retries: number;
  max_retries: number;
}

interface AttemptResponseRow {
  item_snapshot_id: string;
  response_payload: JsonRecord;
}

interface SnapshotRow {
  item_snapshot_id: string;
  question_type: string;
  source_item_id?: string;
}

interface ScoringConfigRow {
  item_id: string;
  correct_response: JsonRecord;
  scoring_rules: JsonRecord | null;
  max_score: number;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();

  try {
    if (req.method !== 'POST') {
      return errorResponse('INVALID_REQUEST', 'Method not allowed', correlationId);
    }

    if (!isInternalRequest(req)) {
      return errorResponse('FORBIDDEN', 'Internal worker access only', correlationId);
    }

    const db = createServiceClient();

    const { data: pickedJobs, error: pickError } = await db.rpc('pick_scoring_job');
    if (pickError) {
      console.error('pick_scoring_job error:', pickError);
      return errorResponse('SERVER_ERROR', 'Failed to pick scoring job', correlationId);
    }

    const job = Array.isArray(pickedJobs) && pickedJobs.length > 0 ? (pickedJobs[0] as ScoringJob) : null;
    if (!job) {
      return successResponse({ processed: false, reason: 'no_pending_jobs' }, correlationId);
    }

    try {
      const { data: attempt, error: attemptError } = await db
        .from('attempts')
        .select('id, domain, year_level, status, scored_at, engine_version')
        .eq('id', job.attempt_id)
        .single();

      if (attemptError || !attempt) {
        throw new Error(`Attempt lookup failed for job ${job.id}`);
      }

      if (attempt.status === 'scored') {
        await completeJob(db, job.id);
        return successResponse({ processed: true, attempt_id: job.attempt_id, status: 'already_scored' }, correlationId);
      }

      const { data: responseRows, error: responseError } = await db
        .from('attempt_responses')
        .select('item_snapshot_id, response_payload')
        .eq('attempt_id', job.attempt_id);

      if (responseError) {
        throw new Error(`Response lookup failed: ${responseError.message}`);
      }

      const { data: snapshotData, error: snapshotError } = await db
        .from('attempt_snapshots')
        .select('snapshot_data')
        .eq('attempt_id', job.attempt_id)
        .single();

      if (snapshotError || !snapshotData) {
        throw new Error('Snapshot lookup failed');
      }

      const snapshotRows = Array.isArray(snapshotData.snapshot_data)
        ? (snapshotData.snapshot_data as SnapshotRow[])
        : [];

      const sourceItemIds = snapshotRows
        .map((row) => row.source_item_id)
        .filter((value): value is string => typeof value === 'string' && UUID_REGEX.test(value));

      let scoringRows: ScoringConfigRow[] = [];
      if (sourceItemIds.length > 0) {
        const { data, error: scoringError } = await db
          .from('item_scoring_config')
          .select('item_id, correct_response, scoring_rules, max_score')
          .in('item_id', sourceItemIds);

        if (scoringError) {
          throw new Error(`Scoring config lookup failed: ${scoringError.message}`);
        }

        scoringRows = (data ?? []) as ScoringConfigRow[];
      }

      const responseMap = new Map<string, AttemptResponseRow>();
      for (const row of (responseRows ?? []) as AttemptResponseRow[]) {
        responseMap.set(row.item_snapshot_id, row);
      }

      const scoringMap = new Map<string, ScoringConfigRow>();
      for (const row of scoringRows) {
        scoringMap.set(row.item_id, row);
      }

      const itemResults = snapshotRows.map((snapshotRow) => {
        const responseRow = responseMap.get(snapshotRow.item_snapshot_id);
        const config = snapshotRow.source_item_id ? scoringMap.get(snapshotRow.source_item_id) : null;

        const isCorrect =
          responseRow && config
            ? scoreResponse(snapshotRow.question_type, responseRow.response_payload, config)
            : false;

        const maxScore = config?.max_score ?? 1;

        return {
          attempt_id: job.attempt_id,
          item_snapshot_id: snapshotRow.item_snapshot_id,
          is_correct: isCorrect,
          score_awarded: isCorrect ? maxScore : 0,
          max_score: maxScore,
        };
      });

      const totalItems = itemResults.length;
      const correctCount = itemResults.filter((row) => row.is_correct).length;
      const scoreRaw = itemResults.reduce((sum, row) => sum + Number(row.score_awarded), 0);
      const scorePct = totalItems === 0 ? 0 : Number(((correctCount / totalItems) * 100).toFixed(2));
      const bandEstimate = estimateBand(scorePct);
      const scoredAt = new Date().toISOString();

      const { error: itemResultsError } = await db.from('attempt_item_results').upsert(itemResults, {
        onConflict: 'attempt_id,item_snapshot_id',
      });

      if (itemResultsError) {
        throw new Error(`Item result insert failed: ${itemResultsError.message}`);
      }

      const { error: attemptResultsError } = await db.from('attempt_results').upsert(
        {
          attempt_id: job.attempt_id,
          domain: attempt.domain,
          year_level: attempt.year_level,
          total_items: totalItems,
          correct_count: correctCount,
          score_raw: scoreRaw,
          score_pct: scorePct,
          band_estimate: bandEstimate,
          engine_version: attempt.engine_version ?? '1.0.0',
          scored_at: scoredAt,
        },
        { onConflict: 'attempt_id' },
      );

      if (attemptResultsError) {
        throw new Error(`Attempt result insert failed: ${attemptResultsError.message}`);
      }

      const { error: attemptUpdateError } = await db
        .from('attempts')
        .update({
          status: 'scored',
          scored_at: scoredAt,
        })
        .eq('id', job.attempt_id)
        .eq('status', 'submitted');

      if (attemptUpdateError) {
        throw new Error(`Attempt status update failed: ${attemptUpdateError.message}`);
      }

      await completeJob(db, job.id);

      return successResponse(
        { processed: true, attempt_id: job.attempt_id, status: 'scored' },
        correlationId,
      );
    } catch (error) {
      await handleJobFailure(db, job, error);
      throw error;
    }
  } catch (err) {
    console.error('Unhandled error in scoring-worker:', err);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

function isInternalRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  return Boolean(
    authHeader &&
      authHeader.startsWith('Bearer ') &&
      serviceRoleKey &&
      authHeader.slice('Bearer '.length) === serviceRoleKey,
  );
}

function scoreResponse(
  questionType: string,
  responsePayload: JsonRecord,
  config: ScoringConfigRow,
): boolean {
  switch (questionType) {
    case 'mcq':
      return responsePayload.selected_option_id === config.correct_response.correct_option_id;

    case 'short_text':
      return normalizeText(responsePayload.text) === normalizeText(config.correct_response.text);

    case 'numeric': {
      const submitted = Number.parseFloat(String(responsePayload.value ?? ''));
      const expected = Number(config.correct_response.value);
      const tolerance = Number(config.scoring_rules?.tolerance ?? 0);

      return Number.isFinite(submitted) && Number.isFinite(expected)
        ? Math.abs(submitted - expected) <= tolerance
        : false;
    }

    case 'multi_select': {
      const submitted = normalizeStringArray(responsePayload.selected_option_ids);
      const expected = normalizeStringArray(config.correct_response.correct_option_ids);

      if (!submitted || !expected) {
        return false;
      }

      return submitted.length === expected.length && submitted.every((value, index) => value === expected[index]);
    }

    default:
      return false;
  }
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map((entry) => String(entry))
    .sort((a, b) => a.localeCompare(b));
}

function estimateBand(scorePct: number): string {
  if (scorePct >= 90) return 'Exceeding';
  if (scorePct >= 70) return 'Strong';
  if (scorePct >= 50) return 'Developing';
  if (scorePct >= 30) return 'Needs support';
  return 'Below expectations';
}

async function completeJob(db: ReturnType<typeof createServiceClient>, jobId: string) {
  const { error } = await db
    .from('scoring_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Job completion failed: ${error.message}`);
  }
}

async function handleJobFailure(
  db: ReturnType<typeof createServiceClient>,
  job: ScoringJob,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : 'Unknown scoring error';
  const nextRetries = job.retries + 1;
  const terminal = nextRetries >= job.max_retries;

  const { error: updateError } = await db
    .from('scoring_jobs')
    .update({
      retries: nextRetries,
      status: terminal ? 'dead' : 'pending',
      last_error: message,
      started_at: null,
      completed_at: terminal ? new Date().toISOString() : null,
    })
    .eq('id', job.id);

  if (updateError) {
    console.error('Failed to update scoring job after error:', updateError);
  }

  if (!terminal) {
    return;
  }

  const { error: dlqError } = await db.from('dead_letter_queue').insert({
    source_table: 'scoring_jobs',
    source_id: job.id,
    error: message,
    payload: {
      attempt_id: job.attempt_id,
      idempotency_key: job.idempotency_key,
      job_type: job.job_type,
    },
  });

  if (dlqError) {
    console.error('Failed to write DLQ record:', dlqError);
  }
}

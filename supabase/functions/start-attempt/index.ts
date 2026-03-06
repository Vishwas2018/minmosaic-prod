import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { parseBodyWithLimit } from '../_shared/bodyLimit.ts';
import { handleCors } from '../_shared/cors.ts';
import { computeSnapshotHash } from '../_shared/hash.ts';
import { errorResponse, successResponse } from '../_shared/responses.ts';

const DEFAULT_TIME_LIMIT_SEC = 2700;
const ENGINE_VERSION = '1.0.0';
const NO_REPEAT_WINDOW = 50;
const DEFAULT_ITEMS_PER_EXAM = 20;
const VALID_DOMAINS = ['reading', 'writing', 'col', 'numeracy'] as const;
const VALID_YEAR_LEVELS = [3, 5, 7, 9] as const;

interface StartAttemptBody {
  domain: (typeof VALID_DOMAINS)[number];
  year_level: (typeof VALID_YEAR_LEVELS)[number];
}

interface AttemptRow {
  id: string;
  user_id: string | null;
  domain: StartAttemptBody['domain'];
  year_level: StartAttemptBody['year_level'];
  status: 'created' | 'started' | 'in_progress';
  time_limit_sec: number;
  started_at: string | null;
  expires_at: string | null;
  submitted_at?: string | null;
  scored_at?: string | null;
  auto_submitted?: boolean | null;
  auto_submit_reason?: string | null;
  submission_id?: string | null;
  snapshot_hash?: string | null;
  engine_version?: string | null;
  created_at?: string;
  updated_at?: string;
  randomization_seed?: string | null;
}

interface SnapshotServerItem {
  item_snapshot_id: string;
  position: number;
  question_type: string;
  item_code: string;
  stem: unknown;
  stimulus: unknown;
  interaction_config: unknown;
  media_refs: unknown;
  source_item_id: string;
}

interface SnapshotRow {
  snapshot_data: SnapshotServerItem[];
}

interface ItemSelectionRow {
  id: string;
  item_code: string;
  question_type: string;
  stem: unknown;
  stimulus: unknown;
  interaction_config: unknown;
  media_refs: unknown;
}

interface SupabaseLikeClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
    insert: (values: unknown) => InsertBuilder;
    delete: () => FilterBuilder;
  };
}

interface QueryBuilder {
  eq: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: unknown[]) => QueryBuilder;
  not: (column: string, operator: string, value: string) => QueryBuilder;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: <T>() => Promise<{ data: T | null; error: unknown }>;
  single: <T>() => Promise<{ data: T | null; error: unknown }>;
  returns: <T>() => Promise<{ data: T | null; error: unknown }>;
}

interface InsertBuilder {
  select: () => InsertBuilder;
  single: <T>() => Promise<{ data: T | null; error: unknown }>;
}

interface FilterBuilder {
  eq: (column: string, value: unknown) => Promise<{ error: unknown }>;
}

function validateBody(
  body: unknown,
): { data: StartAttemptBody; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const { domain, year_level } = body as Record<string, unknown>;

  if (!VALID_DOMAINS.includes(domain as (typeof VALID_DOMAINS)[number])) {
    return {
      data: null,
      error: `Invalid domain. Must be one of: ${VALID_DOMAINS.join(', ')}`,
    };
  }

  const parsedYearLevel = typeof year_level === 'string' ? parseInt(year_level, 10) : year_level;
  if (!VALID_YEAR_LEVELS.includes(parsedYearLevel as (typeof VALID_YEAR_LEVELS)[number])) {
    return {
      data: null,
      error: `Invalid year_level. Must be one of: ${VALID_YEAR_LEVELS.join(', ')}`,
    };
  }

  return {
    data: {
      domain: domain as StartAttemptBody['domain'],
      year_level: parsedYearLevel as StartAttemptBody['year_level'],
    },
    error: null,
  };
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  const correlationId = crypto.randomUUID();

  try {
    if (req.method !== 'POST') {
      return errorResponse('INVALID_REQUEST', 'Method not allowed', correlationId);
    }

    const { body, error: bodyError } = await parseBodyWithLimit(req);
    if (bodyError) {
      return errorResponse(bodyError, 'Invalid or oversized request body', correlationId);
    }

    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', correlationId);
    }
    const userId = auth.user.id;

    const { data: parsed, error: validationError } = validateBody(body);
    if (validationError) {
      return errorResponse('INVALID_REQUEST', validationError, correlationId);
    }

    const { domain, year_level } = parsed;
    const db = createServiceClient() as unknown as SupabaseLikeClient;

    // Serialize parallel starts at the DB layer so only one active attempt can exist.
    const { data: activeCount, error: countError } = await db.rpc('count_active_attempts', {
      p_user_id: userId,
    });

    if (countError) {
      console.error('count_active_attempts error:', countError);
      return errorResponse('SERVER_ERROR', 'Failed to check active attempts', correlationId);
    }

    if (typeof activeCount === 'number' && activeCount >= 1) {
      const { data: existing, error: existError } = await db
        .from('attempts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['created', 'started', 'in_progress'])
        .maybeSingle<AttemptRow>();

      if (existError) {
        console.error('Existing attempt lookup error:', existError);
        return errorResponse('SERVER_ERROR', 'Failed to check existing attempts', correlationId);
      }

      if (existing && existing.domain === domain && existing.year_level === year_level) {
        const { data: existingSnapshot, error: snapError } = await db
          .from('attempt_snapshots')
          .select('snapshot_data')
          .eq('attempt_id', existing.id)
          .single<SnapshotRow>();

        if (snapError || !existingSnapshot) {
          console.error('Snapshot lookup error:', snapError);
          return errorResponse('SERVER_ERROR', 'Failed to retrieve snapshot', correlationId);
        }

        return successResponse(
          {
            attempt: toClientAttempt(existing),
            attempt_id: existing.id,
            snapshot: stripScoringData(existingSnapshot.snapshot_data),
            server_now: new Date().toISOString(),
            expires_at: existing.expires_at,
            time_limit_sec: existing.time_limit_sec,
          },
          correlationId,
        );
      }

      return errorResponse(
        'CONCURRENT_ATTEMPT_LIMIT',
        'You already have an exam in progress. Please complete or abandon it first.',
        correlationId,
        existing
          ? {
              attempt_id: existing.id,
              domain: existing.domain,
              year_level: existing.year_level,
              status: existing.status,
            }
          : undefined,
      );
    }

    const seenItemIds = await getSeenItemIds(db, userId, domain, year_level, NO_REPEAT_WINDOW);
    const randomSeed = crypto.randomUUID();
    const items = await selectItems(db, domain, year_level, seenItemIds);

    if (items.length === 0) {
      return errorResponse(
        'SERVER_ERROR',
        'No items available for this domain and year level',
        correlationId,
      );
    }

    const snapshotData: SnapshotServerItem[] = items.map((item, index) => ({
      item_snapshot_id: crypto.randomUUID(),
      position: index,
      question_type: item.question_type,
      item_code: item.item_code,
      stem: item.stem,
      stimulus: item.stimulus ?? null,
      interaction_config: item.interaction_config,
      media_refs: item.media_refs ?? null,
      source_item_id: item.id,
    }));

    const snapshotHash = await computeSnapshotHash(snapshotData);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_TIME_LIMIT_SEC * 1000);

    const { data: attempt, error: attemptError } = await db
      .from('attempts')
      .insert({
        user_id: userId,
        domain,
        year_level,
        status: 'started',
        time_limit_sec: DEFAULT_TIME_LIMIT_SEC,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        snapshot_hash: snapshotHash,
        engine_version: ENGINE_VERSION,
        randomization_seed: randomSeed,
      })
      .select()
      .single<AttemptRow>();

    if (attemptError || !attempt) {
      console.error('Attempt creation error:', attemptError);
      return errorResponse('SERVER_ERROR', 'Failed to create attempt', correlationId);
    }

    const { error: snapshotError } = await db.from('attempt_snapshots').insert({
      attempt_id: attempt.id,
      snapshot_data: snapshotData,
      snapshot_hash: snapshotHash,
    });

    if (snapshotError) {
      console.error('Snapshot creation error:', snapshotError);
      await db.from('attempts').delete().eq('id', attempt.id);
      return errorResponse('SERVER_ERROR', 'Failed to create snapshot', correlationId);
    }

    return successResponse(
      {
        attempt: toClientAttempt(attempt),
        attempt_id: attempt.id,
        snapshot: stripScoringData(snapshotData),
        server_now: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        time_limit_sec: DEFAULT_TIME_LIMIT_SEC,
      },
      correlationId,
    );
  } catch (error) {
    console.error('Unhandled error in start-attempt:', error);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

async function getSeenItemIds(
  db: SupabaseLikeClient,
  userId: string,
  domain: string,
  yearLevel: number,
  windowSize: number,
): Promise<string[]> {
  const { data: recentAttempts } = await db
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('domain', domain)
    .eq('year_level', yearLevel)
    .order('created_at', { ascending: false })
    .limit(windowSize)
    .returns<Array<{ id: string }>>();

  if (!recentAttempts || recentAttempts.length === 0) {
    return [];
  }

  const attemptIds = recentAttempts.map((attempt) => attempt.id);

  const { data: snapshots } = await db
    .from('attempt_snapshots')
    .select('snapshot_data')
    .in('attempt_id', attemptIds)
    .returns<SnapshotRow[]>();

  if (!snapshots || snapshots.length === 0) {
    return [];
  }

  const seenIds = new Set<string>();
  for (const snapshot of snapshots) {
    if (Array.isArray(snapshot.snapshot_data)) {
      for (const item of snapshot.snapshot_data) {
        seenIds.add(item.source_item_id);
      }
    }
  }

  return Array.from(seenIds);
}

async function selectItems(
  db: SupabaseLikeClient,
  domain: string,
  yearLevel: number,
  seenItemIds: string[],
): Promise<ItemSelectionRow[]> {
  const allowedTypes = ['mcq', 'short_text', 'numeric', 'multi_select'];

  let query = db
    .from('items')
    .select('id, item_code, question_type, stem, stimulus, interaction_config, media_refs')
    .eq('domain', domain)
    .eq('year_level', yearLevel)
    .eq('status', 'published')
    .in('question_type', allowedTypes);

  if (seenItemIds.length > 0) {
    query = query.not('id', 'in', `(${seenItemIds.join(',')})`);
  }

  const { data: freshItems, error: freshError } = await query
    .limit(DEFAULT_ITEMS_PER_EXAM)
    .returns<ItemSelectionRow[]>();

  if (freshError) {
    console.error('Item selection error:', freshError);
    return [];
  }

  if (freshItems && freshItems.length >= DEFAULT_ITEMS_PER_EXAM) {
    return shuffleArray(freshItems).slice(0, DEFAULT_ITEMS_PER_EXAM);
  }

  const freshCount = freshItems?.length ?? 0;
  const needed = DEFAULT_ITEMS_PER_EXAM - freshCount;

  if (needed > 0 && seenItemIds.length > 0) {
    const { data: repeatItems } = await db
      .from('items')
      .select('id, item_code, question_type, stem, stimulus, interaction_config, media_refs')
      .eq('domain', domain)
      .eq('year_level', yearLevel)
      .eq('status', 'published')
      .in('question_type', allowedTypes)
      .in('id', seenItemIds)
      .limit(needed)
      .returns<ItemSelectionRow[]>();

    return shuffleArray([...(freshItems ?? []), ...(repeatItems ?? [])]).slice(
      0,
      DEFAULT_ITEMS_PER_EXAM,
    );
  }

  return shuffleArray(freshItems ?? []);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

// Remove server-only scoring ids before sending the snapshot to the client.
function stripScoringData(snapshotData: SnapshotServerItem[]) {
  return snapshotData.map(({ source_item_id, ...rest }) => rest);
}

function toClientAttempt(attempt: AttemptRow) {
  return {
    id: attempt.id,
    user_id: attempt.user_id ?? null,
    domain: attempt.domain,
    year_level: attempt.year_level,
    status: attempt.status,
    time_limit_sec: attempt.time_limit_sec,
    started_at: attempt.started_at ?? null,
    expires_at: attempt.expires_at ?? null,
    submitted_at: attempt.submitted_at ?? null,
    scored_at: attempt.scored_at ?? null,
    auto_submitted: attempt.auto_submitted ?? false,
    auto_submit_reason: attempt.auto_submit_reason ?? null,
    submission_id: attempt.submission_id ?? null,
    snapshot_hash: attempt.snapshot_hash ?? null,
    engine_version: attempt.engine_version ?? null,
    created_at: attempt.created_at ?? attempt.started_at ?? new Date().toISOString(),
    updated_at: attempt.updated_at ?? attempt.started_at ?? new Date().toISOString(),
  };
}

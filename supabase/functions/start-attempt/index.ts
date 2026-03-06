// supabase/functions/start-attempt/index.ts
// Step 1.4 — startAttempt Edge Function
//
// Creates a new exam attempt with immutable snapshot.
// See spec §4 (lifecycle), §5 (timer), §8 (snapshots), §19 Step 1.4.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateRequest, createServiceClient } from '../_shared/auth.ts';
import { parseBodyWithLimit } from '../_shared/bodyLimit.ts';
import { successResponse, errorResponse } from '../_shared/responses.ts';
import { computeSnapshotHash } from '../_shared/hash.ts';

// ─── Constants (matching packages/shared/src/constants.ts) ───
const DEFAULT_TIME_LIMIT_SEC = 2700; // 45 minutes
const ENGINE_VERSION = '1.0.0';
const NO_REPEAT_WINDOW = 50;
const DEFAULT_ITEMS_PER_EXAM = 20;

// ─── Zod-equivalent validation (Deno doesn't import from packages/shared) ───
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
  status: 'started' | 'in_progress' | 'created';
  time_limit_sec: number;
  started_at: string | null;
  expires_at: string | null;
  submitted_at?: string | null;
  scored_at?: string | null;
  auto_submitted?: boolean;
  auto_submit_reason?: string | null;
  submission_id?: string | null;
  snapshot_hash?: string | null;
  engine_version?: string | null;
  created_at?: string;
  updated_at?: string;
}

function validateBody(
  body: unknown,
): { data: StartAttemptBody; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const { domain, year_level } = body as Record<string, unknown>;

  if (!VALID_DOMAINS.includes(domain as any)) {
    return {
      data: null,
      error: `Invalid domain. Must be one of: ${VALID_DOMAINS.join(', ')}`,
    };
  }

  const yl = typeof year_level === 'string' ? parseInt(year_level, 10) : year_level;
  if (!VALID_YEAR_LEVELS.includes(yl as any)) {
    return {
      data: null,
      error: `Invalid year_level. Must be one of: ${VALID_YEAR_LEVELS.join(', ')}`,
    };
  }

  return {
    data: {
      domain: domain as StartAttemptBody['domain'],
      year_level: yl as StartAttemptBody['year_level'],
    },
    error: null,
  };
}

// ─── Main handler ───

serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const correlationId = crypto.randomUUID();

  try {
    // 1. Method check
    if (req.method !== 'POST') {
      return errorResponse('INVALID_REQUEST', 'Method not allowed', correlationId);
    }

    // 2. Enforce body limit (64KB)
    const { body, error: bodyError } = await parseBodyWithLimit(req);
    if (bodyError) {
      return errorResponse(bodyError, 'Invalid or oversized request body', correlationId);
    }

    // 3. Authenticate JWT → extract user_id
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', correlationId);
    }
    const userId = auth.user.id;

    // 4. Validate request body
    const { data: parsed, error: validationError } = validateBody(body);
    if (validationError) {
      return errorResponse('INVALID_REQUEST', validationError, correlationId);
    }
    const { domain, year_level } = parsed;

    // 5. Service role client for privileged DB operations
    const db = createServiceClient();

    // 6. CONCURRENT ATTEMPT GUARD (§4)
    //    count_active_attempts locks rows with FOR UPDATE to serialize concurrent requests
    const { data: activeCount, error: countError } = await db.rpc('count_active_attempts', {
      p_user_id: userId,
    });

    if (countError) {
      console.error('count_active_attempts error:', countError);
      return errorResponse('SERVER_ERROR', 'Failed to check active attempts', correlationId);
    }

    // 7. IDEMPOTENCY: if there's already an active attempt, return it
    //    This handles both the concurrent limit AND the "repeated start" case
    if (activeCount >= 1) {
      // Check if the active attempt is for the same domain
      const { data: existing, error: existError } = await db
        .from('attempts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['created', 'started', 'in_progress'])
        .maybeSingle();

      if (existError) {
        console.error('Existing attempt lookup error:', existError);
        return errorResponse('SERVER_ERROR', 'Failed to check existing attempts', correlationId);
      }

      if (existing && existing.domain === domain && existing.year_level === year_level) {
        // Same domain+year: idempotent — return existing attempt + snapshot
        const { data: existingSnapshot, error: snapError } = await db
          .from('attempt_snapshots')
          .select('snapshot_data')
          .eq('attempt_id', existing.id)
          .single();

        if (snapError || !existingSnapshot) {
          console.error('Snapshot lookup error:', snapError);
          return errorResponse('SERVER_ERROR', 'Failed to retrieve snapshot', correlationId);
        }

        // Strip source_item_id from snapshot before returning to client (§3.A confidentiality)
        const clientSnapshot = stripScoringData(existingSnapshot.snapshot_data);

        return successResponse(
          {
            attempt: toClientAttempt(existing),
            attempt_id: existing.id,
            snapshot: clientSnapshot,
            server_now: new Date().toISOString(),
            expires_at: existing.expires_at,
            time_limit_sec: existing.time_limit_sec,
          },
          correlationId,
        );
      }

      // Different domain or year: genuinely concurrent — reject
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

    // 8. CONTENT SELECTION (§8)
    //    Get item IDs the user has seen in the last 50 attempts for this domain+year
    const seenItemIds = await getSeenItemIds(db, userId, domain, year_level, NO_REPEAT_WINDOW);

    //    Select published items, excluding recently seen, in random order
    const randomSeed = crypto.randomUUID();
    const items = await selectItems(db, domain, year_level, seenItemIds);

    if (items.length === 0) {
      return errorResponse(
        'SERVER_ERROR',
        'No items available for this domain and year level',
        correlationId,
      );
    }

    // 9. BUILD SNAPSHOT (§8)
    const snapshotData = items.map((item: any, idx: number) => ({
      item_snapshot_id: crypto.randomUUID(),
      position: idx,
      question_type: item.question_type,
      item_code: item.item_code,
      stem: item.stem,
      stimulus: item.stimulus ?? null,
      interaction_config: item.interaction_config,
      media_refs: item.media_refs ?? null,
      source_item_id: item.id, // Stored for scoring lookup — NOT sent to client
    }));

    const snapshotHash = await computeSnapshotHash(snapshotData);

    // 10. CREATE ATTEMPT + SNAPSHOT (§4, §5)
    const now = new Date();
    const timeLimitSec = DEFAULT_TIME_LIMIT_SEC;
    const expiresAt = new Date(now.getTime() + timeLimitSec * 1000);

    const { data: attempt, error: attemptError } = await db
      .from('attempts')
      .insert({
        user_id: userId,
        domain,
        year_level,
        status: 'started',
        time_limit_sec: timeLimitSec,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        snapshot_hash: snapshotHash,
        engine_version: ENGINE_VERSION,
        randomization_seed: randomSeed,
      })
      .select()
      .single();

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
      // Attempt to clean up the orphaned attempt
      await db.from('attempts').delete().eq('id', attempt.id);
      return errorResponse('SERVER_ERROR', 'Failed to create snapshot', correlationId);
    }

    // 11. RETURN (strip source_item_id — §3.A)
    const clientSnapshot = stripScoringData(snapshotData);

    return successResponse(
      {
        attempt: toClientAttempt(attempt),
        attempt_id: attempt.id,
        snapshot: clientSnapshot,
        server_now: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        time_limit_sec: timeLimitSec,
      },
      correlationId,
    );
  } catch (err) {
    console.error('Unhandled error in start-attempt:', err);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', correlationId);
  }
});

// ─── Helpers ───

/**
 * Get item IDs the user has seen in recent attempts for this domain+year.
 * Uses the no-repeat window from §8.
 */
async function getSeenItemIds(
  db: any,
  userId: string,
  domain: string,
  yearLevel: number,
  windowSize: number,
): Promise<string[]> {
  // Get the last N attempt IDs for this user+domain+year
  const { data: recentAttempts } = await db
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('domain', domain)
    .eq('year_level', yearLevel)
    .order('created_at', { ascending: false })
    .limit(windowSize);

  if (!recentAttempts || recentAttempts.length === 0) {
    return [];
  }

  const attemptIds = recentAttempts.map((a: any) => a.id);

  // Get all source_item_ids from those attempts' snapshots
  const { data: snapshots } = await db
    .from('attempt_snapshots')
    .select('snapshot_data')
    .in('attempt_id', attemptIds);

  if (!snapshots || snapshots.length === 0) {
    return [];
  }

  const seenIds = new Set<string>();
  for (const snap of snapshots) {
    if (Array.isArray(snap.snapshot_data)) {
      for (const item of snap.snapshot_data) {
        if (item.source_item_id) {
          seenIds.add(item.source_item_id);
        }
      }
    }
  }

  return Array.from(seenIds);
}

/**
 * Select published items for the exam, excluding recently seen ones.
 * Falls back to allowing repeats if the pool is exhausted (§8).
 */
async function selectItems(
  db: any,
  domain: string,
  yearLevel: number,
  seenItemIds: string[],
): Promise<any[]> {
  // Phase 1 scope: MCQ + short_text only (spec §19 Phase 1 scope)
  const allowedTypes = ['mcq', 'short_text', 'numeric', 'multi_select'];

  // Try to select unseen items first
  let query = db
    .from('items')
    .select('id, item_code, question_type, stem, stimulus, interaction_config, media_refs')
    .eq('domain', domain)
    .eq('year_level', yearLevel)
    .eq('status', 'published')
    .in('question_type', allowedTypes);

  if (seenItemIds.length > 0) {
    // Supabase JS doesn't have a "not in" for arrays easily,
    // so we use .not('id', 'in', `(${ids})`) syntax
    query = query.not('id', 'in', `(${seenItemIds.join(',')})`);
  }

  const { data: freshItems, error: freshError } = await query.limit(DEFAULT_ITEMS_PER_EXAM);

  if (freshError) {
    console.error('Item selection error:', freshError);
    return [];
  }

  // If we have enough fresh items, shuffle and return
  if (freshItems && freshItems.length >= DEFAULT_ITEMS_PER_EXAM) {
    return shuffleArray(freshItems).slice(0, DEFAULT_ITEMS_PER_EXAM);
  }

  // Not enough fresh items — allow repeats to fill the gap (§8)
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
      .limit(needed);

    const combined = [...(freshItems ?? []), ...(repeatItems ?? [])];
    return shuffleArray(combined).slice(0, DEFAULT_ITEMS_PER_EXAM);
  }

  // Return whatever we have (may be fewer than 20)
  return shuffleArray(freshItems ?? []);
}

/**
 * Fisher-Yates shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Remove source_item_id from snapshot before sending to client.
 * This is critical for §3.A confidentiality — clients must never
 * be able to look up scoring configs via source item IDs.
 */
function stripScoringData(snapshotData: any[]): any[] {
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

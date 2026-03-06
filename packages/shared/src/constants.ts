// ─── Timer & Exam ───
export const DEFAULT_TIME_LIMIT_SEC = 2700; // 45 minutes
export const GRACE_WINDOW_SEC = 5;
export const AUTOSAVE_INTERVAL_MS = 5000; // 5 seconds
export const STATUS_POLL_INTERVAL_MS = 3000; // 3 seconds

// ─── Word Limits (Writing) ───
export const MAX_WORD_COUNT = 350;
export const MIN_WORD_COUNT = 20;
export const MAX_WRITING_CHARS = 3000;
export const MAX_SHORT_TEXT_CHARS = 1000;

// ─── Payload Limits ───
export const MAX_BODY_SIZE_BYTES = 65536; // 64 KB
export const MAX_ARRAY_ITEMS = 50;
export const MAX_OPTION_IDS = 20;

// ─── Scoring ───
export const ENGINE_VERSION = '1.0.0';
export const MAX_SCORING_RETRIES = 3;

// ─── Content Selection ───
export const NO_REPEAT_WINDOW = 50; // last N attempts
export const DEFAULT_ITEMS_PER_EXAM = 20;

// ─── Anti-Cheat (Phase 2 enforcement) ───
export const FULLSCREEN_EXIT_WARN_THRESHOLD = 2;
export const FULLSCREEN_EXIT_SUBMIT_THRESHOLD = 3;
export const FOCUS_LOSS_WARN_THRESHOLD = 3;
export const FOCUS_LOSS_SUBMIT_THRESHOLD = 4;
export const DEDUP_WINDOW_MS = 1000;

// ─── Guest (Phase 3) ───
export const GUEST_MAX_ATTEMPTS = 3;
export const GUEST_SESSION_TTL_MIN = 15;

// ─── Valid domains and year levels ───
export const DOMAINS = ['reading', 'writing', 'col', 'numeracy'] as const;
export const YEAR_LEVELS = [3, 5, 7, 9] as const;

export type AttemptStatus =
  | 'created'
  | 'started'
  | 'in_progress'
  | 'submitted'
  | 'scored'
  | 'expired'
  | 'abandoned'
  | 'invalidated';

export const TERMINAL_STATUSES: AttemptStatus[] = [
  'scored',
  'expired',
  'abandoned',
  'invalidated',
];

export const ACTIVE_STATUSES: AttemptStatus[] = ['created', 'started', 'in_progress'];

export type Domain = 'reading' | 'writing' | 'col' | 'numeracy';

export type YearLevel = 3 | 5 | 7 | 9;

export type QuestionType =
  | 'mcq'
  | 'multi_select'
  | 'short_text'
  | 'numeric'
  | 'drag_drop'
  | 'inline_dropdown'
  | 'order'
  | 'writing';

export interface Attempt {
  id: string;
  user_id: string | null;
  domain: Domain;
  year_level: YearLevel;
  status: AttemptStatus;
  time_limit_sec: number;
  started_at: string | null;
  expires_at: string | null;
  submitted_at: string | null;
  scored_at: string | null;
  auto_submitted: boolean;
  auto_submit_reason: string | null;
  submission_id: string | null;
  snapshot_hash: string | null;
  engine_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface SnapshotItem {
  item_snapshot_id: string;
  position: number;
  question_type: QuestionType;
  item_code: string; // e.g. READ-Y5-MCQ-001
  stem: Record<string, unknown>;
  stimulus?: Record<string, unknown> | null;
  interaction_config: Record<string, unknown>;
  media_refs?: Record<string, string> | null;
}

export interface ServerSnapshotItem extends SnapshotItem {
  source_item_id: string;
}

export interface AttemptResult {
  attempt_id: string;
  domain: Domain;
  year_level: YearLevel;
  total_items: number;
  correct_count: number;
  score_raw: number;
  score_pct: number;
  band_estimate: string | null;
  engine_version: string;
  scored_at: string;
}

export interface ItemResult {
  attempt_id: string;
  item_snapshot_id: string;
  is_correct: boolean;
  score_awarded: number;
  max_score: number;
}

export interface ScoringJob {
  id: string;
  attempt_id: string;
  idempotency_key: string;
  job_type: 'objective' | 'writing';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead';
  retries: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

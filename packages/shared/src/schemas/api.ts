import { z } from 'zod';
import {
  DOMAINS,
  YEAR_LEVELS,
  MAX_SHORT_TEXT_CHARS,
  MAX_WRITING_CHARS,
  MAX_OPTION_IDS,
  MAX_ARRAY_ITEMS,
} from '../constants';

// ─── Request Schemas ───

export const StartAttemptRequest = z.object({
  domain: z.enum(DOMAINS),
  year_level: z.union([
    z.literal(3),
    z.literal(5),
    z.literal(7),
    z.literal(9),
  ]),
});
export type StartAttemptRequest = z.infer<typeof StartAttemptRequest>;

const MCQPayload = z.object({ selected_option_id: z.string().min(1).max(100) });
const MultiSelectPayload = z.object({
  selected_option_ids: z.array(z.string().min(1).max(100)).min(1).max(MAX_OPTION_IDS),
});
const ShortTextPayload = z.object({ text: z.string().max(MAX_SHORT_TEXT_CHARS) });
const NumericPayload = z.object({ value: z.string().max(100) });
const DragDropPayload = z.object({
  placements: z
    .array(z.object({ item_id: z.string(), slot_id: z.string() }))
    .max(MAX_ARRAY_ITEMS),
});
const InlineDropdownPayload = z.object({
  selections: z
    .array(z.object({ gap_id: z.string(), option_id: z.string() }))
    .max(MAX_ARRAY_ITEMS),
});
const OrderPayload = z.object({
  ordered_item_ids: z.array(z.string().uuid()).max(MAX_ARRAY_ITEMS),
});
const WritingPayload = z.object({
  text: z.string().max(MAX_WRITING_CHARS),
  word_count: z.number().int().nonnegative(),
});

export const ResponsePayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mcq'), ...MCQPayload.shape }),
  z.object({ type: z.literal('multi_select'), ...MultiSelectPayload.shape }),
  z.object({ type: z.literal('short_text'), ...ShortTextPayload.shape }),
  z.object({ type: z.literal('numeric'), ...NumericPayload.shape }),
  z.object({ type: z.literal('drag_drop'), ...DragDropPayload.shape }),
  z.object({ type: z.literal('inline_dropdown'), ...InlineDropdownPayload.shape }),
  z.object({ type: z.literal('order'), ...OrderPayload.shape }),
  z.object({ type: z.literal('writing'), ...WritingPayload.shape }),
]);
export type ResponsePayloadSchema = z.infer<typeof ResponsePayloadSchema>;

export const SaveResponseRequest = z.object({
  attempt_id: z.string().uuid(),
  item_snapshot_id: z.string().uuid(),
  response_payload: ResponsePayloadSchema,
  client_revision: z.number().int().positive(),
});
export type SaveResponseRequest = z.infer<typeof SaveResponseRequest>;

export const SubmitAttemptRequest = z.object({
  attempt_id: z.string().uuid(),
  submission_id: z.string().uuid(),
});
export type SubmitAttemptRequest = z.infer<typeof SubmitAttemptRequest>;

// ─── Response Schemas ───

export const StartAttemptResponse = z.object({
  attempt_id: z.string().uuid(),
  snapshot: z.array(z.unknown()),
  server_now: z.string().datetime(),
  expires_at: z.string().datetime(),
  time_limit_sec: z.number().int(),
});
export type StartAttemptResponse = z.infer<typeof StartAttemptResponse>;

export const SaveResponseResponse = z.object({
  saved: z.boolean(),
  server_revision: z.number().int(),
});

export const SubmitAttemptResponse = z.object({
  status: z.enum(['submitted', 'scored']),
  message: z.string().optional(),
});

export const AttemptStatusResponse = z.object({
  status: z.string(),
  scored_at: z.string().nullable().optional(),
  auto_submitted: z.boolean().optional(),
});

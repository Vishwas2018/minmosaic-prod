/** MCQ response */
export interface MCQResponse {
  selected_option_id: string;
}

/** Multi-select response */
export interface MultiSelectResponse {
  selected_option_ids: string[];
}

/** Short text response */
export interface ShortTextResponse {
  text: string;
}

/** Numeric response */
export interface NumericResponse {
  value: string;
}

/** Drag-drop response */
export interface DragDropResponse {
  placements: Array<{ item_id: string; slot_id: string }>;
}

/** Inline dropdown response */
export interface InlineDropdownResponse {
  selections: Array<{ gap_id: string; option_id: string }>;
}

/** Order response */
export interface OrderResponse {
  ordered_item_ids: string[];
}

/** Writing response */
export interface WritingResponse {
  text: string;
  word_count: number;
}

export type ResponsePayload =
  | MCQResponse
  | MultiSelectResponse
  | ShortTextResponse
  | NumericResponse
  | DragDropResponse
  | InlineDropdownResponse
  | OrderResponse
  | WritingResponse;

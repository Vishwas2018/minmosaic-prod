import { useEffect, useRef } from 'react';
import { MAX_SHORT_TEXT_CHARS } from '@mindmosaic/shared';
import type { SnapshotItem } from '@mindmosaic/shared';
import { QuestionScaffold } from '@/components/exam/QuestionScaffold';
import { useExamStore } from '@/stores/examStore';
import { extractText } from '@/components/exam/MCQRenderer';

interface ShortTextRendererProps {
  item: SnapshotItem;
  questionNumber: number;
}

export function ShortTextRenderer({ item, questionNumber }: ShortTextRendererProps) {
  const setResponse = useExamStore((state) => state.setResponse);
  const responses = useExamStore((state) => state.responses);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const responseEntry = responses.get(item.item_snapshot_id);

  const promptText = extractText(item.stem);
  const stimulusText = extractText(item.stimulus);
  const value = responseEntry?.payload.type === 'short_text' ? responseEntry.payload.text : '';

  useEffect(() => {
    inputRef.current?.focus();
  }, [item.item_snapshot_id]);

  return (
    <QuestionScaffold
      questionNumber={questionNumber}
      itemCode={item.item_code}
      questionType={item.question_type}
      stimulusText={stimulusText}
      promptText={promptText}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={MAX_SHORT_TEXT_CHARS}
        value={value}
        onChange={(event) =>
          setResponse(item.item_snapshot_id, { type: 'short_text', text: event.target.value })
        }
        className="w-full rounded-[22px] border border-slate-300 bg-slate-50 px-5 py-4 text-lg text-slate-900 shadow-inner transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
        placeholder="Type your answer"
      />
      <div className="mt-3 text-right text-xs uppercase tracking-[0.16em] text-slate-400">
        Max {MAX_SHORT_TEXT_CHARS} characters
      </div>
    </QuestionScaffold>
  );
}

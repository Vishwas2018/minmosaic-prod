import { useEffect, useMemo, useRef } from 'react';
import type { SnapshotItem } from '@mindmosaic/shared';
import { QuestionScaffold } from '@/components/exam/QuestionScaffold';
import { useExamStore } from '@/stores/examStore';
import { extractText } from '@/components/exam/MCQRenderer';

interface NumericRendererProps {
  item: SnapshotItem;
  questionNumber: number;
}

export function NumericRenderer({ item, questionNumber }: NumericRendererProps) {
  const setResponse = useExamStore((state) => state.setResponse);
  const responses = useExamStore((state) => state.responses);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const responseEntry = responses.get(item.item_snapshot_id);

  const promptText = extractText(item.stem);
  const stimulusText = extractText(item.stimulus);
  const unit = useMemo(() => {
    const value = item.interaction_config.unit;
    return typeof value === 'string' ? value : null;
  }, [item.interaction_config.unit]);
  const value = responseEntry?.payload.type === 'numeric' ? responseEntry.payload.value : '';

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
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) =>
            setResponse(item.item_snapshot_id, { type: 'numeric', value: event.target.value })
          }
          className="w-full rounded-[22px] border border-slate-300 bg-slate-50 px-5 py-4 text-lg text-slate-900 shadow-inner transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
          placeholder="Type a number"
        />
        {unit ? (
          <span className="rounded-[18px] border border-brand-100 bg-brand-50 px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            {unit}
          </span>
        ) : null}
      </div>
    </QuestionScaffold>
  );
}

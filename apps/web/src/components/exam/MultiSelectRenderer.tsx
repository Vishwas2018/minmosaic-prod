import { useEffect, useMemo, useRef } from 'react';
import type { SnapshotItem } from '@mindmosaic/shared';
import { QuestionScaffold } from '@/components/exam/QuestionScaffold';
import { useExamStore } from '@/stores/examStore';
import { extractText, getOptions } from '@/components/exam/MCQRenderer';

interface MultiSelectRendererProps {
  item: SnapshotItem;
  questionNumber: number;
}

export function MultiSelectRenderer({ item, questionNumber }: MultiSelectRendererProps) {
  const setResponse = useExamStore((state) => state.setResponse);
  const responses = useExamStore((state) => state.responses);
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);
  const responseEntry = responses.get(item.item_snapshot_id);

  const options = useMemo(() => getOptions(item), [item]);
  const promptText = extractText(item.stem);
  const stimulusText = extractText(item.stimulus);
  const selectedIds =
    responseEntry?.payload.type === 'multi_select' ? responseEntry.payload.selected_option_ids : [];

  useEffect(() => {
    firstCheckboxRef.current?.focus();
  }, [item.item_snapshot_id]);

  const toggleOption = (optionId: string) => {
    const current = new Set(selectedIds);

    if (current.has(optionId)) {
      current.delete(optionId);
    } else {
      current.add(optionId);
    }

    setResponse(item.item_snapshot_id, {
      type: 'multi_select',
      selected_option_ids: Array.from(current.values()),
    });
  };

  return (
    <QuestionScaffold
      questionNumber={questionNumber}
      itemCode={item.item_code}
      questionType={item.question_type}
      stimulusText={stimulusText}
      promptText={promptText}
    >
      <div className="space-y-3">
        {options.map((option, index) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-4 rounded-[22px] border p-4 transition md:p-5 ${
              selectedIds.includes(option.id)
                ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-white shadow-[0_8px_30px_rgba(27,86,245,0.14)]'
                : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'
            }`}
          >
            <input
              ref={index === 0 ? firstCheckboxRef : undefined}
              type="checkbox"
              checked={selectedIds.includes(option.id)}
              onChange={() => toggleOption(option.id)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-base leading-8 text-slate-800">{option.label}</span>
          </label>
        ))}
      </div>
    </QuestionScaffold>
  );
}

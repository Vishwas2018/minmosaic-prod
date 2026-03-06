import { useEffect, useMemo, useRef } from 'react';
import type { SnapshotItem } from '@mindmosaic/shared';
import { QuestionScaffold } from '@/components/exam/QuestionScaffold';
import { useExamStore } from '@/stores/examStore';

interface MCQRendererProps {
  item: SnapshotItem;
  questionNumber: number;
}

interface Option {
  id: string;
  label: string;
}

export function MCQRenderer({ item, questionNumber }: MCQRendererProps) {
  const setResponse = useExamStore((state) => state.setResponse);
  const responses = useExamStore((state) => state.responses);
  const radioRefs = useRef<Array<HTMLInputElement | null>>([]);
  const responseEntry = responses.get(item.item_snapshot_id);

  const options = useMemo(() => getOptions(item), [item]);
  const promptText = extractText(item.stem);
  const stimulusText = extractText(item.stimulus);
  const selectedOptionId =
    responseEntry?.payload.type === 'mcq' ? responseEntry.payload.selected_option_id : undefined;

  useEffect(() => {
    radioRefs.current[0]?.focus();
  }, [item.item_snapshot_id]);

  const handleSelect = (optionId: string) => {
    setResponse(item.item_snapshot_id, { type: 'mcq', selected_option_id: optionId });
  };

  const handleArrowNavigation = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowLeft'
    ) {
      return;
    }

    event.preventDefault();

    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + options.length) % options.length;
    const nextOption = options[nextIndex];

    handleSelect(nextOption.id);
    radioRefs.current[nextIndex]?.focus();
  };

  return (
    <QuestionScaffold
      questionNumber={questionNumber}
      itemCode={item.item_code}
      questionType={item.question_type}
      stimulusText={stimulusText}
      promptText={promptText}
    >
      <div role="radiogroup" aria-label={promptText} className="space-y-3">
        {options.map((option, index) => (
          <label
            key={option.id}
            className={`group flex cursor-pointer items-start gap-4 rounded-[22px] border p-4 transition md:p-5 ${
              selectedOptionId === option.id
                ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-white shadow-[0_8px_30px_rgba(27,86,245,0.14)]'
                : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'
            }`}
          >
            <input
              ref={(node) => {
                radioRefs.current[index] = node;
              }}
              type="radio"
              name={item.item_snapshot_id}
              checked={selectedOptionId === option.id}
              onChange={() => handleSelect(option.id)}
              onKeyDown={(event) => handleArrowNavigation(event, index)}
              className="mt-1 h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-base leading-8 text-slate-800">{option.label}</span>
          </label>
        ))}
      </div>
    </QuestionScaffold>
  );
}

export function extractText(value: Record<string, unknown> | null | undefined): string {
  if (!value) {
    return '';
  }

  const text = value.text;
  return typeof text === 'string' ? text : JSON.stringify(value);
}

export function getOptions(item: SnapshotItem): Option[] {
  const rawOptions = item.interaction_config.options;
  if (!Array.isArray(rawOptions)) {
    return [];
  }

  return rawOptions.flatMap((option) => {
    if (!option || typeof option !== 'object') {
      return [];
    }

    const record = option as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.label !== 'string') {
      return [];
    }

    return [{ id: record.id, label: record.label }];
  });
}

import { MCQRenderer } from '@/components/exam/MCQRenderer';
import { MultiSelectRenderer } from '@/components/exam/MultiSelectRenderer';
import { NumericRenderer } from '@/components/exam/NumericRenderer';
import { ShortTextRenderer } from '@/components/exam/ShortTextRenderer';
import { useExamStore } from '@/stores/examStore';

export function QuestionRenderer() {
  const snapshot = useExamStore((state) => state.snapshot);
  const currentIndex = useExamStore((state) => state.currentIndex);
  const currentItem = snapshot[currentIndex];

  if (!currentItem) {
    return null;
  }

  switch (currentItem.question_type) {
    case 'mcq':
      return <MCQRenderer item={currentItem} questionNumber={currentIndex + 1} />;
    case 'short_text':
      return <ShortTextRenderer item={currentItem} questionNumber={currentIndex + 1} />;
    case 'numeric':
      return <NumericRenderer item={currentItem} questionNumber={currentIndex + 1} />;
    case 'multi_select':
      return <MultiSelectRenderer item={currentItem} questionNumber={currentIndex + 1} />;
    default:
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Question type <code>{currentItem.question_type}</code> is not supported in Phase 1.
        </div>
      );
  }
}

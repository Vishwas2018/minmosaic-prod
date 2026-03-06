import { useExamStore } from '@/stores/examStore';

export function QuestionStrip() {
  const snapshot = useExamStore((state) => state.snapshot);
  const responses = useExamStore((state) => state.responses);
  const currentIndex = useExamStore((state) => state.currentIndex);
  const flaggedItems = useExamStore((state) => state.flaggedItems);
  const setCurrentIndex = useExamStore((state) => state.setCurrentIndex);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {snapshot.map((item, index) => {
        const answered = responses.has(item.item_snapshot_id);
        const flagged = flaggedItems.has(item.item_snapshot_id);
        const active = index === currentIndex;

        return (
          <button
            key={item.item_snapshot_id}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`relative h-11 min-w-11 rounded-full border text-sm font-semibold transition ${
              answered
                ? 'border-brand-600 bg-brand-600 text-white shadow-[0_8px_24px_rgba(27,86,245,0.2)]'
                : 'border-slate-300 bg-white text-slate-700'
            } ${active ? 'scale-105 ring-4 ring-brand-100 ring-offset-2' : 'hover:border-brand-200 hover:bg-brand-50/40'}`}
          >
            {index + 1}
            {flagged ? (
              <span className="absolute -bottom-0.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-500 ring-2 ring-white" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

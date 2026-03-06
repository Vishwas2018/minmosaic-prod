import { type ReactNode, useMemo, useState } from 'react';
import { Timer } from '@/components/exam/Timer';
import { QuestionStrip } from '@/components/exam/QuestionStrip';
import { SubmitModal } from '@/components/exam/SubmitModal';
import { useExamStore } from '@/stores/examStore';

interface ExamShellProps {
  children: ReactNode;
}

export function ExamShell({ children }: ExamShellProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const snapshot = useExamStore((state) => state.snapshot);
  const currentIndex = useExamStore((state) => state.currentIndex);
  const setCurrentIndex = useExamStore((state) => state.setCurrentIndex);
  const saveStatus = useExamStore((state) => state.saveStatus);
  const responses = useExamStore((state) => state.responses);
  const attempt = useExamStore((state) => state.attempt);
  const flaggedItems = useExamStore((state) => state.flaggedItems);
  const toggleFlag = useExamStore((state) => state.toggleFlag);
  const currentItem = snapshot[currentIndex];
  const domainLabel = attempt?.domain ? formatDomain(attempt.domain) : 'Practice exam';

  const progressText = useMemo(
    () => `${Math.min(currentIndex + 1, snapshot.length)} / ${snapshot.length || 0}`,
    [currentIndex, snapshot.length],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,234,255,0.9),_rgba(250,252,255,0.92)_34%,_rgba(255,248,240,0.78)_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Exam in progress</div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {domainLabel} <span className="text-slate-400">·</span> Progress {progressText}
            </h1>
            <p className="text-sm text-slate-500">
              Stay focused. Your responses are tracked question by question.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SaveIndicator status={saveStatus} />
            <div className="rounded-[20px] border border-brand-100 bg-white px-4 py-3 shadow-sm">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Answered</div>
              <div className="text-lg font-semibold text-slate-950">{responses.size}</div>
              <div className="text-xs text-slate-400">{flaggedItems.size} flagged</div>
            </div>
            <Timer />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-100 bg-white/90 px-4 py-2 shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Current</span>
            <span className="text-sm font-semibold text-slate-700">
              Question {currentIndex + 1} of {snapshot.length}
            </span>
          </div>

          {currentItem ? (
            <button
              type="button"
              onClick={() => toggleFlag(currentItem.item_snapshot_id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                flaggedItems.has(currentItem.item_snapshot_id)
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/60'
              }`}
            >
              {flaggedItems.has(currentItem.item_snapshot_id)
                ? 'Flagged for review'
                : 'Flag for review'}
            </button>
          ) : null}
        </div>

        <div className="flex-1 rounded-[32px] border border-white/80 bg-white/70 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          {children}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-white/70 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex >= snapshot.length - 1}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(27,86,245,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="rounded-xl border border-brand-600 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700"
            >
              Review & submit
            </button>
          </div>
          <QuestionStrip />
        </div>
      </footer>

      <SubmitModal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
    </div>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  const text =
    status === 'saving'
      ? 'Saving...'
      : status === 'saved'
        ? 'Saved'
        : status === 'error'
          ? 'Save issue'
          : 'Not saved yet';
  const dotClass =
    status === 'saving'
      ? 'bg-brand-500'
      : status === 'saved'
        ? 'bg-emerald-500'
        : status === 'error'
          ? 'bg-amber-500'
          : 'bg-slate-300';

  return (
    <div className="flex items-center gap-2 rounded-[20px] border border-brand-100 bg-white px-4 py-3 shadow-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className="text-sm font-medium text-slate-600">{text}</span>
    </div>
  );
}

function formatDomain(domain: string) {
  if (domain === 'col') {
    return 'Conventions of Language';
  }

  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

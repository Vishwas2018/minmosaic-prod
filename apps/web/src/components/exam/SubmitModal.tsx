import { useMemo } from 'react';
import { ErrorMessages } from '@mindmosaic/shared';
import { FunctionInvokeError } from '@/lib/functionErrors';
import { useExamStore } from '@/stores/examStore';
import { useSubmitAttempt } from '@/hooks/useSubmitAttempt';

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitModal({ open, onClose }: SubmitModalProps) {
  const attempt = useExamStore((state) => state.attempt);
  const snapshot = useExamStore((state) => state.snapshot);
  const responses = useExamStore((state) => state.responses);
  const flaggedItems = useExamStore((state) => state.flaggedItems);
  const submitAttempt = useSubmitAttempt();

  const stats = useMemo(
    () => ({
      answered: responses.size,
      unanswered: Math.max(snapshot.length - responses.size, 0),
      flagged: flaggedItems.size,
    }),
    [flaggedItems.size, responses.size, snapshot.length],
  );

  if (!open || !attempt) {
    return null;
  }

  const errorMessage = getSubmitErrorMessage(submitAttempt.error);

  const handleSubmit = async () => {
    await submitAttempt.mutateAsync({
      attempt_id: attempt.id,
      submission_id: crypto.randomUUID(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-brand-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
        <div className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700">
          Final check
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Ready to submit?</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          You can still review your answers before final submission.
        </p>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <StatCard label="Answered" value={stats.answered} />
          <StatCard label="Unanswered" value={stats.unanswered} />
          <StatCard label="Flagged" value={stats.flagged} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
          >
            Keep reviewing
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitAttempt.isPending}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(27,86,245,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitAttempt.isPending ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
    </div>
  );
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof FunctionInvokeError) {
    if (error.code) {
      return error.message || ErrorMessages[error.code];
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

import { Navigate, useParams } from 'react-router-dom';
import { ExamShell } from '@/components/exam/ExamShell';
import { QuestionRenderer } from '@/components/exam/QuestionRenderer';
import { ScoringWaitScreen } from '@/components/exam/ScoringWaitScreen';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useAutosave } from '@/hooks/useAutosave';
import { useAttemptStatus } from '@/hooks/useAttemptStatus';
import { useExamStore } from '@/stores/examStore';

export function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const attempt = useExamStore((state) => state.attempt);
  const snapshot = useExamStore((state) => state.snapshot);
  const currentItem = snapshot[useExamStore((state) => state.currentIndex)];
  const { data: attemptStatusData } = useAttemptStatus(attemptId ?? null, {
    enabled: Boolean(attemptId),
  });

  useAutosave();
  useAntiCheat();

  if (!attempt || !attemptId || attempt.id !== attemptId) {
    return <Navigate to="/" replace />;
  }

  if (attempt.status === 'submitted' || attemptStatusData?.status === 'submitted') {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-16">
        <ScoringWaitScreen attemptId={attemptId} />
      </div>
    );
  }

  if (attempt.status === 'scored' || attemptStatusData?.status === 'scored') {
    return <Navigate to={`/exam/${attemptId}/results`} replace />;
  }

  if (!currentItem) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">No question loaded</h1>
          <p className="mt-2 text-sm text-gray-500">
            This attempt does not have snapshot content in memory yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ExamShell>
      <QuestionRenderer />
    </ExamShell>
  );
}

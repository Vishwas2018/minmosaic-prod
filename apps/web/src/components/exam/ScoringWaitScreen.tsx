import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttemptStatus } from '@/hooks/useAttemptStatus';

interface ScoringWaitScreenProps {
  attemptId: string;
}

export function ScoringWaitScreen({ attemptId }: ScoringWaitScreenProps) {
  const navigate = useNavigate();
  const { data } = useAttemptStatus(attemptId, { enabled: true });

  useEffect(() => {
    if (data?.status === 'scored') {
      navigate(`/exam/${attemptId}/results`, { replace: true });
    }
  }, [attemptId, data?.status, navigate]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Scoring your exam…</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your submission is complete. We&apos;re calculating your result now.
        </p>
      </div>
    </div>
  );
}

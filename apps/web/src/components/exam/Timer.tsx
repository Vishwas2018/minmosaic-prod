import { useEffect } from 'react';
import { useExamStore } from '@/stores/examStore';

export function Timer() {
  const timerRemainingSec = useExamStore((state) => state.timerRemainingSec);
  const decrementTimer = useExamStore((state) => state.decrementTimer);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [decrementTimer]);

  const minutes = Math.floor(timerRemainingSec / 60);
  const seconds = timerRemainingSec % 60;
  const colorClass =
    timerRemainingSec <= 60
      ? 'text-red-700'
      : timerRemainingSec <= 300
        ? 'text-amber-700'
        : 'text-slate-950';
  const shellClass =
    timerRemainingSec <= 60
      ? 'border-red-200 bg-red-50'
      : timerRemainingSec <= 300
        ? 'border-amber-200 bg-amber-50'
        : 'border-brand-100 bg-white';

  return (
    <div className={`rounded-[20px] border px-4 py-3 shadow-sm ${shellClass}`}>
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Time remaining</div>
      <div className={`text-lg font-semibold tabular-nums ${colorClass}`}>
        {timerRemainingSec === 0
          ? "Time's up!"
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
      </div>
    </div>
  );
}

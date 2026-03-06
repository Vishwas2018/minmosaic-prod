import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorMessages, YEAR_LEVELS } from '@mindmosaic/shared';
import type { AttemptResult, Domain, YearLevel } from '@mindmosaic/shared';
import { FunctionInvokeError } from '@/lib/functionErrors';
import { useAbandonAttempt } from '@/hooks/useAbandonAttempt';
import { useStartAttempt } from '@/hooks/useStartAttempt';
import { supabase } from '@/lib/supabase';

interface PreviousAttemptRow {
  id: string;
  domain: Exclude<Domain, 'writing'>;
  year_level: YearLevel;
  created_at: string;
  attempt_results: AttemptResult | AttemptResult[] | null;
}

const DOMAIN_LABELS: Record<Exclude<Domain, 'writing'>, string> = {
  reading: 'Reading',
  col: 'Conventions of Language',
  numeracy: 'Numeracy',
};

export function ExamSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domainParam = searchParams.get('domain');
  const domain = isExamDomain(domainParam) ? domainParam : null;
  const startAttempt = useStartAttempt();
  const abandonAttempt = useAbandonAttempt();
  const errorMessage = getErrorMessage(startAttempt.error);
  const activeAttempt = getActiveAttemptDetails(startAttempt.error);
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttemptRow[]>([]);
  const [loadingPreviousAttempts, setLoadingPreviousAttempts] = useState(true);

  const title = useMemo(() => (domain ? DOMAIN_LABELS[domain] : 'Practice exam'), [domain]);

  useEffect(() => {
    let cancelled = false;

    const loadPreviousAttempts = async () => {
      setLoadingPreviousAttempts(true);

      const { data, error } = await supabase
        .from('attempts')
        .select(
          'id, domain, year_level, created_at, attempt_results(attempt_id, domain, year_level, total_items, correct_count, score_raw, score_pct, band_estimate, engine_version, scored_at)',
        )
        .eq('status', 'scored')
        .order('created_at', { ascending: false })
        .limit(10);

      if (cancelled) {
        return;
      }

      if (error) {
        setPreviousAttempts([]);
        setLoadingPreviousAttempts(false);
        return;
      }

      const rows = (data ?? [])
        .filter(isPreviousAttemptRow)
        .filter((row) => row.domain !== 'writing');

      setPreviousAttempts(rows);
      setLoadingPreviousAttempts(false);
    };

    void loadPreviousAttempts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!domain) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(27,86,245,0.12),_transparent_28%),linear-gradient(180deg,_#fefefe_0%,_#eef6ff_100%)] px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_rgba(21,32,87,0.12)] backdrop-blur">
          <div className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Practice mode
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            Choose a learning area first
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
            Head back to the dashboard and choose Reading, Conventions of Language, or
            Numeracy before starting a practice exam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(27,86,245,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,204,112,0.18),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#fefbf6_54%,_#ffffff_100%)]">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52">
          <div className="absolute left-8 top-6 h-24 w-24 rounded-full bg-brand-200/50 blur-2xl" />
          <div className="absolute right-16 top-10 h-28 w-28 rounded-full bg-amber-200/60 blur-3xl" />
          <div className="absolute left-1/3 top-0 h-20 w-20 rounded-full bg-sky-200/50 blur-2xl" />
        </div>

        <section className="relative rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-[0_28px_80px_rgba(21,32,87,0.12)] backdrop-blur sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                {title}
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Pick your year level and start practicing
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Each practice exam is timed, friendly, and built to help kids build
                confidence one question at a time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
                <div className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2">
                  45 minute practice flow
                </div>
                <div className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2">
                  Instant score summary
                </div>
                <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2">
                  Calm, kid-friendly exam space
                </div>
              </div>
            </div>

            <div className="grid w-full max-w-sm gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-brand-100 bg-gradient-to-br from-brand-600 to-brand-500 p-5 text-white shadow-[0_18px_45px_rgba(27,86,245,0.28)]">
                <div className="text-xs uppercase tracking-[0.24em] text-brand-100">
                  Ready to begin
                </div>
                <div className="mt-3 text-3xl font-semibold">{YEAR_LEVELS.length} levels</div>
                <p className="mt-2 text-sm leading-6 text-brand-50">
                  Choose the best fit and jump straight into a practice session.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
                <div className="text-xs uppercase tracking-[0.24em] text-amber-700">
                  Current content
                </div>
                <p className="mt-3 text-sm leading-6">
                  This environment currently has seeded practice content for Year 5 only.
                </p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-[0_16px_36px_rgba(244,63,94,0.08)]">
            {errorMessage}
          </div>
        ) : null}

        {activeAttempt ? (
          <section className="mt-6 rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,_rgba(255,251,235,0.98),_rgba(255,245,220,0.9))] p-6 shadow-[0_20px_50px_rgba(245,158,11,0.12)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Active attempt
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatDomain(activeAttempt.domain)} / Year {activeAttempt.year_level}
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  You already have an exam in progress with status{' '}
                  {activeAttempt.status.replace('_', ' ')}. You can jump back in or abandon it
                  before starting a new one.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(`/exam/${activeAttempt.attempt_id}`)}
                  className="rounded-2xl border border-white/70 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Resume current exam
                </button>
                <button
                  type="button"
                  onClick={() =>
                    abandonAttempt.mutate(
                      { attempt_id: activeAttempt.attempt_id },
                      {
                        onSuccess: () => {
                          startAttempt.reset();
                        },
                      },
                    )
                  }
                  disabled={abandonAttempt.isPending}
                  className="rounded-2xl border border-amber-300 bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {abandonAttempt.isPending ? 'Abandoning...' : 'Abandon current exam'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Choose a level
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Start with the year that feels right
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {YEAR_LEVELS.map((yearLevel, index) => (
              <button
                key={yearLevel}
                type="button"
                onClick={() => startAttempt.mutate({ domain, year_level: yearLevel as YearLevel })}
                disabled={startAttempt.isPending}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-6 text-left shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(27,86,245,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-400 via-sky-300 to-amber-300" />
                <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-brand-100/70 blur-2xl transition duration-200 group-hover:bg-brand-200/80" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Year level
                      </div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        Year {yearLevel}
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {getYearCardTag(index)}
                    </div>
                  </div>

                  <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
                    {getYearCardDescription(yearLevel)}
                  </p>

                  <div className="mt-6 inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(27,86,245,0.28)]">
                    {startAttempt.isPending ? 'Creating attempt...' : 'Start exam'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                History
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Previous Attempts
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Revisit past practice sessions and see how your confidence is growing.
              </p>
            </div>
          </div>

          {loadingPreviousAttempts ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
              Loading previous attempts...
            </div>
          ) : previousAttempts.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
              No scored attempts yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {previousAttempts.map((attempt) => {
                const result = Array.isArray(attempt.attempt_results)
                  ? attempt.attempt_results[0]
                  : attempt.attempt_results;

                return (
                  <button
                    key={attempt.id}
                    type="button"
                    onClick={() => navigate(`/exam/${attempt.id}/results`)}
                    className="flex w-full flex-col gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {formatDomain(attempt.domain)} / Year {attempt.year_level}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">
                        {result
                          ? `${result.correct_count}/${result.total_items} correct (${formatPercent(result.score_pct)})`
                          : 'Result unavailable'}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {result?.band_estimate ?? 'No band estimate'} /{' '}
                        {formatAttemptDate(attempt.created_at)}
                      </div>
                    </div>

                    <div className="rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      View results
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function isExamDomain(value: string | null): value is Exclude<Domain, 'writing'> {
  return value === 'reading' || value === 'col' || value === 'numeracy';
}

function getErrorMessage(error: unknown) {
  if (error instanceof FunctionInvokeError) {
    if (error.message) {
      return error.message;
    }

    if (error.code) {
      return ErrorMessages[error.code];
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

function getActiveAttemptDetails(
  error: unknown,
): {
  attempt_id: string;
  domain: Exclude<Domain, 'writing'>;
  year_level: YearLevel;
  status: string;
} | null {
  if (!(error instanceof FunctionInvokeError) || error.code !== 'CONCURRENT_ATTEMPT_LIMIT') {
    return null;
  }

  const details = error.details;
  if (!details) {
    return null;
  }

  const attempt_id = typeof details.attempt_id === 'string' ? details.attempt_id : null;
  const candidateDomain = typeof details.domain === 'string' ? details.domain : null;
  const domain = isExamDomain(candidateDomain) ? candidateDomain : null;
  const year_level =
    details.year_level === 3 ||
    details.year_level === 5 ||
    details.year_level === 7 ||
    details.year_level === 9
      ? details.year_level
      : null;
  const status = typeof details.status === 'string' ? details.status : null;

  if (!attempt_id || !domain || !year_level || !status) {
    return null;
  }

  return { attempt_id, domain, year_level, status };
}

function formatDomain(domain: Exclude<Domain, 'writing'>) {
  if (domain === 'col') {
    return 'Conventions of Language';
  }

  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatAttemptDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isPreviousAttemptRow(value: unknown): value is PreviousAttemptRow {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.domain === 'string' &&
    typeof row.year_level === 'number' &&
    typeof row.created_at === 'string'
  );
}

function getYearCardTag(index: number) {
  const tags = ['Bright start', 'Most popular', 'Challenge zone', 'Big leap'];
  return tags[index] ?? 'Practice';
}

function getYearCardDescription(yearLevel: YearLevel) {
  const descriptions: Record<YearLevel, string> = {
    3: 'A gentle starting point with clear prompts and confidence-building practice.',
    5: 'A balanced practice set for building speed, focus, and accurate answers.',
    7: 'A stronger challenge with more independence and deeper thinking.',
    9: 'A stretch level for older students ready to test stamina and strategy.',
  };

  return descriptions[yearLevel];
}

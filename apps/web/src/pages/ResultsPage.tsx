import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { AttemptResult, ItemResult, SnapshotItem } from '@mindmosaic/shared';
import { supabase, supabasePublishableKey, supabaseUrl } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { extractText } from '@/components/exam/MCQRenderer';

interface AttemptSnapshotRow {
  snapshot_data: SnapshotItem[];
}

interface ReviewItem {
  item_snapshot_id: string;
  position: number;
  item_code: string;
  question_type: string;
  stem: Record<string, unknown>;
  is_correct: boolean;
  correct_answer: string | null;
  explanation: string;
}

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const session = useAuthStore((state) => state.session);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [itemResults, setItemResults] = useState<ItemResult[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotItem[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewWarning, setReviewWarning] = useState<string | null>(null);
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId || !session?.access_token) {
      return;
    }

    let cancelled = false;

    const loadResults = async () => {
      setLoading(true);
      setError(null);
      setReviewWarning(null);
      setReviewLoaded(false);

      const [resultResponse, itemResultsResponse, snapshotResponse] = await Promise.all([
        supabase.from('attempt_results').select('*').eq('attempt_id', attemptId).single(),
        supabase.from('attempt_item_results').select('*').eq('attempt_id', attemptId),
        supabase.from('attempt_snapshots').select('snapshot_data').eq('attempt_id', attemptId).single(),
      ]);

      if (cancelled) {
        return;
      }

      if (resultResponse.error || !resultResponse.data) {
        setError(resultResponse.error?.message ?? 'Unable to load attempt result.');
        setLoading(false);
        return;
      }

      if (itemResultsResponse.error) {
        setError(itemResultsResponse.error.message);
        setLoading(false);
        return;
      }

      if (snapshotResponse.error || !snapshotResponse.data) {
        setError(snapshotResponse.error?.message ?? 'Unable to load question breakdown.');
        setLoading(false);
        return;
      }

      setResult(resultResponse.data as AttemptResult);
      setItemResults((itemResultsResponse.data ?? []) as ItemResult[]);
      setSnapshot(((snapshotResponse.data as AttemptSnapshotRow).snapshot_data ?? []) as SnapshotItem[]);

      try {
        const reviewResponse = await fetch(
          `${supabaseUrl}/functions/v1/get-attempt-review?attempt_id=${attemptId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: supabasePublishableKey,
            },
          },
        );

        const reviewPayload = (await reviewResponse.json()) as
          | { data: { items: ReviewItem[] } }
          | { error: { message: string } };

        if (!reviewResponse.ok || !('data' in reviewPayload)) {
          setReviewWarning(
            'error' in reviewPayload
              ? reviewPayload.error.message
              : 'Correct answers are temporarily unavailable.',
          );
        } else {
          setReviewItems(reviewPayload.data.items);
          setReviewLoaded(true);
        }
      } catch {
        setReviewWarning(
          'Correct answers and explanations are temporarily unavailable. Core results are still shown.',
        );
      }

      setLoading(false);
    };

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [attemptId, session?.access_token]);

  const breakdown = useMemo(() => {
    const itemResultMap = new Map(itemResults.map((row) => [row.item_snapshot_id, row]));
    const reviewMap = new Map(reviewItems.map((item) => [item.item_snapshot_id, item]));

    return snapshot
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        item,
        result: itemResultMap.get(item.item_snapshot_id) ?? null,
        review: reviewMap.get(item.item_snapshot_id) ?? null,
      }));
  }, [itemResults, reviewItems, snapshot]);

  if (!attemptId) {
    return <Navigate to="/" replace />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-16">
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="text-sm text-slate-500">Loading your results...</div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-16">
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Results unavailable</h1>
          <p className="mt-3 text-sm text-red-700">
            {error ?? 'We could not load this attempt result.'}
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,234,255,0.9),_rgba(250,252,255,0.92)_34%,_rgba(255,248,240,0.78)_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Practice result</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                You got {result.correct_count} out of {result.total_items} correct ({formatPercent(result.score_pct)})
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Practice result - not an official NAPLAN score.
              </p>
            </div>

            <div className="rounded-[24px] border border-brand-100 bg-brand-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-brand-700">Band estimate</div>
              <div className="mt-2 text-2xl font-semibold text-brand-900">
                {result.band_estimate ?? 'Pending'}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                reviewLoaded
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {reviewLoaded ? 'Review data loaded' : 'Review data unavailable'}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard label="Correct" value={`${result.correct_count}`} />
            <MetricCard label="Total questions" value={`${result.total_items}`} />
            <MetricCard label="Score" value={formatPercent(result.score_pct)} />
          </div>

          {reviewWarning ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {reviewWarning}
            </div>
          ) : null}

          <div className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">Question breakdown</h2>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Correct answers and explanations
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {breakdown.map(({ item, result: itemResult, review }, index) => (
                <div
                  key={item.item_snapshot_id}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold ${
                        itemResult?.is_correct
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {itemResult?.is_correct ? '✓' : '✗'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Question {index + 1}
                      </div>
                      <p className="mt-2 text-base leading-8 text-slate-800">
                        {extractText(item.stem)}
                      </p>

                      {!itemResult?.is_correct && review?.correct_answer ? (
                        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-brand-700">
                            Correct answer
                          </div>
                          <div className="mt-2 text-sm font-semibold text-brand-900">
                            {review.correct_answer}
                          </div>
                        </div>
                      ) : null}

                      {review?.explanation ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            Explanation
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-700">
                            {review.explanation}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/exam/select"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(27,86,245,0.28)]"
            >
              Start New Exam
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

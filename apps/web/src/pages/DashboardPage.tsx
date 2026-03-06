import { useNavigate } from 'react-router-dom';
import { DOMAINS } from '@mindmosaic/shared';
import type { Domain } from '@mindmosaic/shared';
import { useAuthStore } from '@/stores/authStore';

const DOMAIN_LABELS: Record<
  string,
  {
    label: string;
    icon: string;
    accent: string;
    badge: string;
    description: string;
    meta: string;
  }
> = {
  reading: {
    label: 'Reading',
    icon: 'Book',
    accent:
      'from-sky-100 via-white to-blue-50 border-sky-200 text-sky-900 shadow-[0_18px_44px_rgba(59,130,246,0.12)]',
    badge: 'bg-sky-100 text-sky-700',
    description: 'Explore stories and information texts, then answer questions with care.',
    meta: 'MCQ + Short Answer / 45 min',
  },
  col: {
    label: 'Conventions of Language',
    icon: 'Language',
    accent:
      'from-rose-50 via-white to-violet-50 border-fuchsia-200 text-fuchsia-950 shadow-[0_18px_44px_rgba(168,85,247,0.12)]',
    badge: 'bg-fuchsia-100 text-fuchsia-700',
    description: 'Practice spelling, punctuation, and grammar in a playful, focused format.',
    meta: 'MCQ + Short Answer / 45 min',
  },
  numeracy: {
    label: 'Numeracy',
    icon: 'Numbers',
    accent:
      'from-amber-50 via-white to-orange-50 border-amber-200 text-amber-950 shadow-[0_18px_44px_rgba(245,158,11,0.12)]',
    badge: 'bg-amber-100 text-amber-700',
    description: 'Build confidence with number sense, problem solving, and quick reasoning.',
    meta: 'MCQ + Short Answer / 45 min',
  },
  writing: {
    label: 'Writing',
    icon: 'Writing',
    accent: 'from-slate-100 via-white to-slate-50 border-slate-200 text-slate-500',
    badge: 'bg-slate-100 text-slate-500',
    description: 'Coming in a future phase.',
    meta: 'Coming in Phase 2',
  },
};

export function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleStart = (domain: Domain) => {
    navigate(`/exam/select?domain=${domain}`);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(27,86,245,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_20%),linear-gradient(180deg,_#f7fbff_0%,_#fffdf8_55%,_#ffffff_100%)]">
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56">
          <div className="absolute left-10 top-2 h-28 w-28 rounded-full bg-brand-200/50 blur-3xl" />
          <div className="absolute right-8 top-10 h-32 w-32 rounded-full bg-amber-200/50 blur-3xl" />
        </div>

        <header className="relative rounded-[1.75rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-lg font-bold text-white shadow-[0_12px_28px_rgba(27,86,245,0.28)]">
                M
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  MindMosaic
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  Welcome back
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="text-sm text-slate-500">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-900 hover:shadow-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="relative mt-6">
          <section className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                  Practice dashboard
                </div>
                <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Start a practice exam
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Choose a domain to begin. Each practice exam is timed, friendly, and scored
                  automatically so learners can build confidence step by step.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
                  <div className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2">
                    Timed sessions
                  </div>
                  <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2">
                    Instant progress feedback
                  </div>
                  <div className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2">
                    Kid-friendly design
                  </div>
                </div>
              </div>

              <div className="grid w-full max-w-sm gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.5rem] border border-brand-100 bg-gradient-to-br from-brand-600 to-brand-500 p-5 text-white shadow-[0_18px_45px_rgba(27,86,245,0.28)]">
                  <div className="text-xs uppercase tracking-[0.24em] text-brand-100">
                    Practice areas
                  </div>
                  <div className="mt-3 text-3xl font-semibold">3 live now</div>
                  <p className="mt-2 text-sm leading-6 text-brand-50">
                    Reading, language, and numeracy are ready to explore today.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
                  <div className="text-xs uppercase tracking-[0.24em] text-amber-700">
                    Phase 1
                  </div>
                  <p className="mt-3 text-sm leading-6">
                    Writing is still on the roadmap and will arrive in Phase 2.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Choose a domain
                </div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Pick a learning area to begin
                </h3>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {DOMAINS.filter((d): d is Exclude<Domain, 'writing'> => d !== 'writing').map((domain) => {
                const meta = DOMAIN_LABELS[domain];

                return (
                  <button
                    key={domain}
                    onClick={() => handleStart(domain)}
                    className={`group relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-6 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] ${meta.accent}`}
                  >
                    <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/70 blur-2xl transition duration-200 group-hover:scale-110" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-sm font-semibold uppercase tracking-[0.16em] shadow-sm">
                          {meta.icon}
                        </div>
                        <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${meta.badge}`}>
                          Ready
                        </div>
                      </div>

                      <h4 className="mt-5 text-2xl font-semibold tracking-tight">{meta.label}</h4>
                      <p className="mt-3 max-w-sm text-sm leading-6 opacity-80">{meta.description}</p>

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                          {meta.meta}
                        </div>
                        <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow-sm">
                          Start
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-50 p-6 text-left text-slate-500 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/70 blur-2xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-sm font-semibold uppercase tracking-[0.16em] shadow-sm">
                      Writing
                    </div>
                    <div className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Soon
                    </div>
                  </div>

                  <h4 className="mt-5 text-2xl font-semibold tracking-tight text-slate-700">Writing</h4>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    Writing practice is planned for a later phase and is not available yet.
                  </p>

                  <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Coming in Phase 2
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[1.75rem] border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-sky-50 p-5 text-sm text-brand-900 shadow-[0_18px_44px_rgba(27,86,245,0.08)]">
            <strong>Phase 1 MVP:</strong> Reading, Conventions of Language, and Numeracy practice
            exams with MCQ and short text questions. Writing will follow in Phase 2.
          </section>
        </main>

        <footer className="relative py-8 text-center text-sm text-slate-400">
          Practice platform / not an official NAPLAN system
        </footer>
      </div>
    </div>
  );
}

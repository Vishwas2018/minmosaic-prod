import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { DOMAINS, YEAR_LEVELS } from '@mindmosaic/shared';

const DOMAIN_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  reading: { label: 'Reading', icon: '📖', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  col: { label: 'Conventions of Language', icon: '✏️', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  numeracy: { label: 'Numeracy', icon: '🔢', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  writing: { label: 'Writing', icon: '📝', color: 'bg-green-50 border-green-200 text-green-700' },
};

export function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleStart = (domain: string) => {
    // For now navigate to exam select — will wire up startAttempt in Step 1.4
    navigate(`/exam/select?domain=${domain}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">MindMosaic</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Start a practice exam</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a domain to begin. Each exam is timed and your results will be scored
            automatically.
          </p>
        </div>

        {/* Domain cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {DOMAINS.filter((d) => d !== 'writing').map((domain) => {
            const meta = DOMAIN_LABELS[domain];
            return (
              <button
                key={domain}
                onClick={() => handleStart(domain)}
                className={`p-5 rounded-xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${meta.color}`}
              >
                <div className="text-2xl mb-2">{meta.icon}</div>
                <div className="font-semibold">{meta.label}</div>
                <div className="text-xs mt-1 opacity-70">MCQ + Short Answer • 45 min</div>
              </button>
            );
          })}
          {/* Writing disabled for Phase 1 */}
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed">
            <div className="text-2xl mb-2 opacity-50">📝</div>
            <div className="font-semibold">Writing</div>
            <div className="text-xs mt-1">Coming in Phase 2</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Phase 1 MVP:</strong> Reading, Conventions of Language, and Numeracy practice exams
          with MCQ + short text questions. Writing module coming in Phase 2.
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
        Practice platform — not an official NAPLAN system
      </footer>
    </div>
  );
}

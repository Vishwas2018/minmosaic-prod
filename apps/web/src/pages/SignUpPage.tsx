import { useState } from 'react';
import { ErrorMessages } from '@mindmosaic/shared';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function SignUpPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, displayName);
      setSuccess(true);
    } catch (error) {
      setError(getAuthErrorMessage(error, 'sign_up'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
              OK
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Check your email</h2>
            <p className="mb-4 text-sm text-gray-500">
              We sent a confirmation link to <strong>{email}</strong>. Click the link to activate
              your account.
            </p>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">MindMosaic</h1>
          <p className="mt-1 text-sm text-gray-500">Create your practice account</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Sign up</h2>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Display name
              </label>
              <input
                id="name"
                type="text"
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Alex"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Min 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:bg-brand-400"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function getAuthErrorMessage(error: unknown, mode: 'sign_in' | 'sign_up') {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return mode === 'sign_in'
        ? 'Incorrect email or password.'
        : ErrorMessages.SERVER_ERROR;
    }

    if (message.includes('email not confirmed')) {
      return 'Please confirm your email before signing in.';
    }

    if (message.includes('already registered')) {
      return 'An account with this email already exists.';
    }

    if (message.includes('password')) {
      return mode === 'sign_up'
        ? 'Password must be at least 8 characters.'
        : 'Incorrect email or password.';
    }
  }

  return mode === 'sign_in'
    ? 'Unable to sign in right now.'
    : 'Unable to create your account right now.';
}

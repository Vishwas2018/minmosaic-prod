import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExamPage } from '@/pages/ExamPage';
import { ExamSelectPage } from '@/pages/ExamSelectPage';
import { LoginPage } from '@/pages/LoginPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { SignUpPage } from '@/pages/SignUpPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestGuard>
                <LoginPage />
              </GuestGuard>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestGuard>
                <SignUpPage />
              </GuestGuard>
            }
          />
          <Route
            path="/"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/exam/select"
            element={
              <AuthGuard>
                <ExamSelectPage />
              </AuthGuard>
            }
          />
          <Route
            path="/exam/:attemptId"
            element={
              <AuthGuard>
                <ExamPage />
              </AuthGuard>
            }
          />
          <Route
            path="/exam/:attemptId/results"
            element={
              <AuthGuard>
                <ResultsPage />
              </AuthGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

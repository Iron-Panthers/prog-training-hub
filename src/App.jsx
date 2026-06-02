import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from "react";

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import UnitsPage from './pages/UnitsPage';
import UnitDetail from './pages/UnitDetail';
import SandboxPage from './pages/SandboxPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminUnits from './pages/AdminUnits';
import { SubmissionsList, SubmissionReview } from './pages/AdminSubmissions';

// Layout
import AppShell from './components/layout/AppShell';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange/30 border-t-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading Iron Panthers Hub...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Student routes */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <AppShell user={user}>
              <StudentDashboard user={user} />
            </AppShell>
          ) : <Navigate to="/" />
        }
      />
      <Route
        path="/units"
        element={
          user ? (
            <AppShell user={user}>
              <UnitsPage user={user} />
            </AppShell>
          ) : <Navigate to="/" />
        }
      />
      <Route
        path="/units/:id"
        element={
          user ? (
            <AppShell user={user}>
              <UnitDetail user={user} />
            </AppShell>
          ) : <Navigate to="/" />
        }
      />
      <Route
        path="/sandbox"
        element={
          user ? (
            <AppShell user={user}>
              <SandboxPage />
            </AppShell>
          ) : <Navigate to="/" />
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          user && isAdmin ? (
            <AppShell user={user}>
              <AdminDashboard user={user} />
            </AppShell>
          ) : user ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        }
      />
      <Route
        path="/admin/announcements"
        element={
          user && isAdmin ? (
            <AppShell user={user}>
              <AdminAnnouncements user={user} />
            </AppShell>
          ) : user ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        }
      />
      <Route
        path="/admin/submissions"
        element={
          user && isAdmin ? (
            <AppShell user={user}>
              <SubmissionsList user={user} />
            </AppShell>
          ) : user ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        }
      />
      <Route
        path="/admin/submissions/:id"
        element={
          user && isAdmin ? (
            <AppShell user={user}>
              <SubmissionReview user={user} />
            </AppShell>
          ) : user ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        }
      />
      <Route
        path="/admin/units"
        element={
          user && isAdmin ? (
            <AppShell user={user}>
              <AdminUnits />
            </AppShell>
          ) : user ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        }
      />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

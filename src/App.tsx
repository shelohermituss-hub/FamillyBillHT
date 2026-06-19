import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { Navbar } from '@/components/navbar'
import { DashboardLayout } from '@/components/dashboard-layout'
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { DashboardPage } from '@/pages/dashboard'
import { TransferPage } from '@/pages/transfer'
import { AccountPage } from '@/pages/account'
import { CardPage } from '@/pages/card'
import { HistoryPage } from '@/pages/history'
import { ProfilePage } from '@/pages/profile'
import { BillsPage } from '@/pages/bills'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse-lime"
          style={{ background: 'var(--lime)' }}>
          <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
        </div>
        <p className="text-sm font-medium text-[var(--ink-60)]">Chargement...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes with top navbar */}
        <Route path="/" element={
          <>
            <Navbar />
            <LandingPage />
          </>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/transfer" element={
          <ProtectedRoute>
            <DashboardLayout>
              <TransferPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/bills" element={
          <ProtectedRoute>
            <DashboardLayout>
              <BillsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute>
            <DashboardLayout>
              <AccountPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/card" element={
          <ProtectedRoute>
            <DashboardLayout>
              <CardPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <DashboardLayout>
              <HistoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </NotificationsProvider>
    </ThemeProvider>
  )
}

export default App

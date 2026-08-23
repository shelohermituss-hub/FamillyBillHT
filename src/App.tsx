import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PwaPrompt } from '@/components/pwa-prompt'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { NotificationsProvider } from '@/lib/notifications-context'
import { DashboardLayout } from '@/components/dashboard-layout'

const LandingPage = lazy(() => import('@/pages/landing').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/register').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password').then(m => ({ default: m.ForgotPasswordPage })))
const SetupPage = lazy(() => import('@/pages/setup').then(m => ({ default: m.SetupPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })))
const TransferPage = lazy(() => import('@/pages/transfer').then(m => ({ default: m.TransferPage })))
const AccountPage = lazy(() => import('@/pages/account').then(m => ({ default: m.AccountPage })))
const CardPage = lazy(() => import('@/pages/card').then(m => ({ default: m.CardPage })))
const HistoryPage = lazy(() => import('@/pages/history').then(m => ({ default: m.HistoryPage })))
const ProfilePage = lazy(() => import('@/pages/profile').then(m => ({ default: m.ProfilePage })))
const BillsPage = lazy(() => import('@/pages/bills').then(m => ({ default: m.BillsPage })))
const WalletPage = lazy(() => import('@/pages/wallet').then(m => ({ default: m.WalletPage })))
const FamilyPage = lazy(() => import('@/pages/family').then(m => ({ default: m.FamilyPage })))
const SupportPage = lazy(() => import('@/pages/support').then(m => ({ default: m.SupportPage })))
const AdminPage = lazy(() => import('@/pages/admin').then(m => ({ default: m.AdminPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found').then(m => ({ default: m.NotFoundPage })))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'var(--lime)' }}>
          <img src="/logo.png" alt="" className="w-full h-full object-cover" />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--ink-60)' }}>Chargement...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><DashboardLayout><TransferPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><DashboardLayout><BillsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><DashboardLayout><WalletPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><DashboardLayout><AccountPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/card" element={<ProtectedRoute><DashboardLayout><CardPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><DashboardLayout><HistoryPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute><DashboardLayout><FamilyPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><DashboardLayout><SupportPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><DashboardLayout><AdminPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fb-theme">
      {/* 1. AuthProvider englobe désormais le reste des composants */}
      <AuthProvider>
        <NotificationsProvider>
          <AppRoutes />
          <PwaPrompt />
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

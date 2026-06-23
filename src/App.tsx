import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PwaPrompt } from '@/components/pwa-prompt'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AdminLayout, AdminProtectedRoute } from '@/components/admin-layout'

// Eagerly loaded (needed for initial render / public routes)
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { NotFoundPage } from '@/pages/not-found'

// Lazily loaded dashboard pages
const SetupPage            = lazy(() => import('@/pages/setup').then(m => ({ default: m.SetupPage })))
const DashboardPage        = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })))
const TransferPage         = lazy(() => import('@/pages/transfer').then(m => ({ default: m.TransferPage })))
const AccountPage          = lazy(() => import('@/pages/account').then(m => ({ default: m.AccountPage })))
const CardPage             = lazy(() => import('@/pages/card').then(m => ({ default: m.CardPage })))
const HistoryPage          = lazy(() => import('@/pages/history').then(m => ({ default: m.HistoryPage })))
const ProfilePage          = lazy(() => import('@/pages/profile').then(m => ({ default: m.ProfilePage })))
const BillsPage            = lazy(() => import('@/pages/bills').then(m => ({ default: m.BillsPage })))
const WalletPage           = lazy(() => import('@/pages/wallet').then(m => ({ default: m.WalletPage })))
const FamilyPage           = lazy(() => import('@/pages/family').then(m => ({ default: m.FamilyPage })))
const SupportPage          = lazy(() => import('@/pages/support').then(m => ({ default: m.SupportPage })))
const NotificationsPage    = lazy(() => import('@/pages/notifications').then(m => ({ default: m.NotificationsPage })))
const BeneficiariesPage    = lazy(() => import('@/pages/beneficiaries').then(m => ({ default: m.BeneficiariesPage })))

// Lazily loaded admin pages
const AdminPage              = lazy(() => import('@/pages/admin').then(m => ({ default: m.AdminPage })))
const AdminDashboardPage     = lazy(() => import('@/pages/admin/dashboard').then(m => ({ default: m.AdminDashboardPage })))
const AdminUsersPage         = lazy(() => import('@/pages/admin/users').then(m => ({ default: m.AdminUsersPage })))
const AdminTransactionsPage  = lazy(() => import('@/pages/admin/transactions').then(m => ({ default: m.AdminTransactionsPage })))
const AdminProvidersPage     = lazy(() => import('@/pages/admin/providers').then(m => ({ default: m.AdminProvidersPage })))
const AdminReceiptsPage      = lazy(() => import('@/pages/admin/receipts').then(m => ({ default: m.AdminReceiptsPage })))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/notifications').then(m => ({ default: m.AdminNotificationsPage })))
const AdminReportsPage       = lazy(() => import('@/pages/admin/reports').then(m => ({ default: m.AdminReportsPage })))
const AdminAuditLogsPage     = lazy(() => import('@/pages/admin/audit-logs').then(m => ({ default: m.AdminAuditLogsPage })))
const AdminSettingsPage      = lazy(() => import('@/pages/admin/settings').then(m => ({ default: m.AdminSettingsPage })))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse-lime"
          style={{ background: 'var(--lime)' }}>
          <img src="/logo.png" alt="" className="w-full h-full object-cover" />
        </div>
        <p className="text-sm font-medium text-[var(--ink-60)]">Chargement...</p>
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
          {/* Public routes */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Post-registration setup wizard */}
          <Route path="/setup" element={
            <ProtectedRoute>
              <SetupPage />
            </ProtectedRoute>
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
          <Route path="/wallet" element={
            <ProtectedRoute>
              <DashboardLayout>
                <WalletPage />
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
          <Route path="/family" element={
            <ProtectedRoute>
              <DashboardLayout>
                <FamilyPage />
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
          <Route path="/support" element={
            <ProtectedRoute>
              <DashboardLayout>
                <SupportPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/beneficiaries" element={
            <ProtectedRoute>
              <DashboardLayout>
                <BeneficiariesPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin routes — protected by AdminProtectedRoute (role check) */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminUsersPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminTransactionsPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/providers" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminProvidersPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/receipts" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminReceiptsPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminNotificationsPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminReportsPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminAuditLogsPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminSettingsPage />
              </AdminLayout>
            </AdminProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <AuthProvider>
          <AppRoutes />
          <PwaPrompt />
        </AuthProvider>
      </NotificationsProvider>
    </ThemeProvider>
  )
}

export default App

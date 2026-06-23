import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AdminLayout, AdminProtectedRoute } from '@/components/admin-layout'
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { DashboardPage } from '@/pages/dashboard'
import { TransferPage } from '@/pages/transfer'
import { AccountPage } from '@/pages/account'
import { CardPage } from '@/pages/card'
import { HistoryPage } from '@/pages/history'
import { AdminPage } from '@/pages/admin'
import { AdminDashboardPage } from '@/pages/admin/dashboard'
import { AdminUsersPage } from '@/pages/admin/users'
import { AdminTransactionsPage } from '@/pages/admin/transactions'
import { AdminProvidersPage } from '@/pages/admin/providers'
import { AdminReceiptsPage } from '@/pages/admin/receipts'
import { AdminNotificationsPage } from '@/pages/admin/notifications'
import { AdminReportsPage } from '@/pages/admin/reports'
import { AdminAuditLogsPage } from '@/pages/admin/audit-logs'
import { AdminSettingsPage } from '@/pages/admin/settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--wise-sage)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--wise-lime)' }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm font-medium">Loading...</p>
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

        {/* Admin routes */}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App

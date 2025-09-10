import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import GroupPage from './pages/GroupPage'
import SettlePage from './pages/SettlePage'
import ProfilePage from './pages/ProfilePage'
import ExpenseDetailsPage from './pages/ExpenseDetailsPage'
import Layout from './components/Layout'
import LoginLayout from "./components/LoginLayout";

function App() {
  const { user, checkAuth, hasCheckedAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // for loading spinner to have dark mode
  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const initial =
      stored !== null
      ? JSON.parse(stored)
      // : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
    document.documentElement.classList.toggle('dark', initial)
  }, [])


  // Show loading spinner while checking authentication
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginLayout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </LoginLayout>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/groups/:id" element={<GroupPage />} />
        <Route path="/groups/:id/settle" element={<SettlePage />} />
        <Route path="/groups/:groupId/expenses/:expenseId" element={<ExpenseDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

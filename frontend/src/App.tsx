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
  const { user, checkAuth } = useAuthStore()
  console.log(user)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

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

import { useState } from 'react'
import {cardDarkMode} from "@/constants/colors";
import { useAuthStore } from '../stores/authStore'
import { LogOut, User, Mail, Calendar, Key } from 'lucide-react'
import ChangePasswordSidebar from '../components/ChangePasswordSidebar'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [showChangePasswordSidebar, setShowChangePasswordSidebar] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`card ${cardDarkMode}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-medium text-primary-600">
                {user.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Name</p>
              <p className="text-sm text-gray-600">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Member since</p>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`card ${cardDarkMode}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h2>
        <div className="space-y-3">
          <button
            onClick={() => setShowChangePasswordSidebar(true)}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Key className="h-4 w-4" />
            Change Password
          </button>
          {/* <button
            onClick={handleLogout}
            className="btn btn-danger w-full flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button> */}
        </div>
      </div>

      {/* <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Expense Splitter</h3>
        <p className="text-sm text-blue-700">
          This is a demo application for splitting expenses with friends and family. 
          All data is stored locally and will be reset when the demo ends.
        </p>
      </div> */}

      {/* Change Password Sidebar */}
      <ChangePasswordSidebar
        isOpen={showChangePasswordSidebar}
        onClose={() => setShowChangePasswordSidebar(false)}
      />
    </div>
  )
}

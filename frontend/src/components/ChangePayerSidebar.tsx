import { useState } from 'react'
import { X, User, Check } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
}

interface ChangePayerSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPayer: {
    id: string
    name: string
    email: string
  }
  members: Member[]
  onPayerChange: (newPayerId: string) => Promise<void>
  isLoading?: boolean
}

export default function ChangePayerSidebar({
  isOpen,
  onClose,
  currentPayer,
  members,
  onPayerChange,
  isLoading = false
}: ChangePayerSidebarProps) {
  const [selectedPayerId, setSelectedPayerId] = useState<string>(currentPayer.id)

  const handleSave = async () => {
    if (selectedPayerId !== currentPayer.id) {
      await onPayerChange(selectedPayerId)
    }
    onClose()
  }

  const handleCancel = () => {
    setSelectedPayerId(currentPayer.id)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change Payer
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Current Payer
              </h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {currentPayer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{currentPayer.name}</p>
                  <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>{currentPayer.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Select New Payer
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <button
                    key={member.user.id}
                    onClick={() => setSelectedPayerId(member.user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedPayerId === member.user.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {member.user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.name}
                      </p>
                      <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>
                        {member.user.email}
                      </p>
                    </div>
                    {selectedPayerId === member.user.id && (
                      <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || selectedPayerId === currentPayer.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

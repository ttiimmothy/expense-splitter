import { X, CheckCircle, Calendar, User, ArrowRight, DollarSign } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'
import dayjs from 'dayjs'

interface Settlement {
  id: string
  amount: number
  createdAt: string
  fromUser: {
    id: string
    name: string
    email: string
  }
  toUser: {
    id: string
    name: string
    email: string
  }
}

interface SettlementDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  settlement: Settlement | null
  currency: string
}

export default function SettlementDetailsModal({ 
  isOpen, 
  onClose, 
  settlement, 
  currency 
}: SettlementDetailsModalProps) {
  if (!isOpen || !settlement) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settlement Details</h3>
              <button
                onClick={onClose}
                className={`text-gray-400 hover:text-gray-600 ${cardTextDarkMode}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Settlement Flow */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-medium text-primary-600 dark:text-primary-300">
                      {settlement.fromUser.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{settlement.fromUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{settlement.fromUser.email}</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-6 w-6 text-gray-400 mb-1" />
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 text-nowrap">
                      {currency} {Number(settlement.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-medium text-green-600 dark:text-green-300">
                      {settlement.toUser.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{settlement.toUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{settlement.toUser.email}</p>
                </div>
              </div>
            </div>

            {/* Settlement Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Settlement Status</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Successfully completed</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Settlement Date</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dayjs(settlement.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Settlement ID</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{settlement.id}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Settlement Complete
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {settlement.fromUser.name} has successfully paid {settlement.toUser.name} {currency} {Number(settlement.amount).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

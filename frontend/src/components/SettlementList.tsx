import { CheckCircle, ArrowRight, Calendar } from 'lucide-react'
import { cardTextDarkMode } from '@/constants/colors'
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

interface SettlementListProps {
  settlements: Settlement[]
  isLoading?: boolean
  currency: string
  onSettlementClick?: (settlement: Settlement) => void
}

export default function SettlementList({ settlements, isLoading, currency, onSettlementClick }: SettlementListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!settlements || settlements.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400">No settlements yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Settlements will appear here when members pay each other</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement) => (
        <div
          key={settlement.id}
          onClick={() => onSettlementClick?.(settlement)}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                  {settlement.fromUser.name.charAt(0)}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <span className="text-sm font-medium text-green-600 dark:text-green-300">
                  {settlement.toUser.name.charAt(0)}
                </span>
              </div>
            </div>
            
            {/* <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {settlement.fromUser.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">paid</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {settlement.toUser.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dayjs(settlement.createdAt).format('MMM D, YYYY')}
                </span>
              </div>
            </div> */}
            
          </div>
          
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {currency} {Number(settlement.amount).toFixed(2)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dayjs(settlement.createdAt).format('MMM D, YYYY')}
                </span>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Settled</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

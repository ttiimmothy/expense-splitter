import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import BalanceChart from '../components/BalanceChart'
import SettlementSuggestions from '../components/SettlementSuggestions'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";
import {socketService} from "@/lib/socket";

interface Balance {
  userId: string
  userName: string
  netBalance: number
}

interface SettlementSuggestion {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
}

export default function SettlePage() {
  const { id } = useParams<{ id: string }>()
  const [showSuggestions, setShowSuggestions] = useState(true)

  const { data: balanceData, isLoading, refetch } = useQuery({
    queryKey: ['balances', id],
    queryFn: async () => {
      const response = await api(`/balances/${id}`)
      return {
        balances: response.data.balances as Balance[],
        suggestions: response.data.suggestions as SettlementSuggestion[]
      }
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (id) {
      socketService.connect()
      socketService.joinSocketGroup(id)
      
      const onSettlementCreated = () => {
        refetch()
      }

      socketService.onSettlementCreated(onSettlementCreated)

      return () => {
        socketService.leaveSocketGroup(id)
        socketService.off('settlement-created', onSettlementCreated)
      }
    }
  }, [id, refetch])

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!balanceData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Unable to load balances</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-300">Please try again later.</p>
      </div>
    )
  }

  const { balances, suggestions } = balanceData

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/groups/${id}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settle Up</h1>
            <p className="text-gray-600 dark:text-gray-400">View balances and settle debts</p>
          </div>
        </div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {showSuggestions ? 'Hide' : 'Show'} Suggestions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`card ${cardDarkMode}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Balances</h2>
          {balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((balance) => (
                <div
                  key={balance.userId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {balance.userName.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{balance.userName}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold ${
                        balance.netBalance > 0
                          ? 'text-green-600'
                          : balance.netBalance < 0
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {balance.netBalance > 0 ? '+' : ''}${balance.netBalance.toFixed(2)}
                    </span>
                    <p className={`text-xs text-gray-500 ${cardTextDarkMode}`}>
                      {balance.netBalance > 0
                        ? 'owed to them'
                        : balance.netBalance < 0
                        ? 'they owe'
                        : 'settled up'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className={`text-gray-500 ${cardTextDarkMode}`}>No balances to display</p>
            </div>
          )}
        </div>

        <div className={`card ${cardDarkMode}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Overview</h2>
          <BalanceChart balances={balances} />
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className={`card ${cardDarkMode}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Settlement Suggestions
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These transactions will minimize the number of payments needed to settle all debts:
          </p>
          <SettlementSuggestions
            suggestions={suggestions}
            onSettlementCreated={() => {
              refetch()
            }}
          />
        </div>
      )}

      {suggestions.length === 0 && balances.every(b => Math.abs(b.netBalance) < 0.01) && (
        <div className={`${cardDarkMode} card text-center py-8`}>
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Settled Up!</h3>
          <p className="text-gray-600">
            Everyone's balances are settled. No payments needed.
          </p>
        </div>
      )}
    </div>
  )
}

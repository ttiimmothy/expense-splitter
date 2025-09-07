import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ArrowLeft, DollarSign, Users, Calendar, User, Receipt, Edit3 } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'
import dayjs from 'dayjs'
import { useState } from 'react'
import ChangePayerSidebar from '../components/ChangePayerSidebar'
import ChangeSplitSidebar from '../components/ChangeSplitSidebar'

interface Expense {
  id: string
  description: string
  amount: number
  split: string
  createdAt: string
  payer: {
    id: string
    name: string
    email: string
  }
  shares: Array<{
    id: string
    amountOwed: number
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

interface Group {
  id: string
  name: string
  currency: string
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
      avatarUrl?: string
    }
  }>
}

export default function ExpenseDetailsPage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const [showPayerSidebar, setShowPayerSidebar] = useState(false)
  const [isUpdatingPayer, setIsUpdatingPayer] = useState(false)
  const [showSplitSidebar, setShowSplitSidebar] = useState(false)
  const [isUpdatingSplit, setIsUpdatingSplit] = useState(false)
  const queryClient = useQueryClient()

  const { data: expense, isLoading, error } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/expenses/${expenseId}`)
      return response.data as Expense
    },
    enabled: !!groupId && !!expenseId
  })

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}`)
      return response.data.group as Group
    },
    enabled: !!groupId
  })

  const handlePayerChange = async (newPayerId: string) => {
    if (!expense || !groupId || !expenseId) return

    setIsUpdatingPayer(true)
    try {
      // Optimistic update
      queryClient.setQueryData(['expense', expenseId], (oldData: Expense | undefined) => {
        if (!oldData) return oldData
        
        const newPayer = group?.members.find(m => m.user.id === newPayerId)?.user
        if (!newPayer) return oldData

        return {
          ...oldData,
          payer: {
            id: newPayer.id,
            name: newPayer.name,
            email: newPayer.email
          }
        }
      })

      // API call
      await api.put(`/groups/${groupId}/expenses/${expenseId}/payer`, {
        payerId: newPayerId
      })

      // Refetch to ensure data consistency
      await queryClient.invalidateQueries({ queryKey: ['expense', expenseId] })
      await queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
    } catch (error) {
      console.error('Failed to update payer:', error)
      // Revert optimistic update on error
      await queryClient.invalidateQueries({ queryKey: ['expense', expenseId] })
    } finally {
      setIsUpdatingPayer(false)
    }
  }

  const handleSplitChange = async (newShares: { userId: string; amount: number }[]) => {
    if (!expense || !groupId || !expenseId) return

    setIsUpdatingSplit(true)
    try {
      // Optimistic update
      queryClient.setQueryData(['expense', expenseId], (oldData: Expense | undefined) => {
        if (!oldData) return oldData

        const updatedShares = newShares.map(share => {
          const user = group?.members.find(m => m.user.id === share.userId)?.user
          if (!user) return null

          return {
            id: `temp-${share.userId}`, // Temporary ID for optimistic update
            amountOwed: share.amount,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          }
        }).filter(Boolean) as typeof oldData.shares

        return {
          ...oldData,
          shares: updatedShares
        }
      })

      // API call
      await api.put(`/groups/${groupId}/expenses/${expenseId}/split`, {
        shares: newShares
      })

      // Refetch to ensure data consistency
      await queryClient.invalidateQueries({ queryKey: ['expense', expenseId] })
      await queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
    } catch (error) {
      console.error('Failed to update split:', error)
      // Revert optimistic update on error
      await queryClient.invalidateQueries({ queryKey: ['expense', expenseId] })
    } finally {
      setIsUpdatingSplit(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Expense not found</h3>
        <div className="mt-1 text-gray-500 dark:text-gray-300">The expense you're looking for doesn't exist.</div>
        <div className="mt-4">
          <Link to={`/groups/${groupId}`} className="btn btn-primary inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Group

          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to={`/groups/${groupId}`} 
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Details</h1>
          <p className="text-gray-600 dark:text-gray-400">View expense information and splits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Overview */}
          <div className={`card ${cardDarkMode}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {expense.description}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Added {dayjs(expense.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount || 0).toFixed(2)}
                </div>
                <div className={`text-sm text-gray-500 ${cardTextDarkMode} capitalize`}>
                  {expense.split.toLowerCase()} split
                </div>
              </div>
            </div>
          </div>

          {/* Split Details */}
          <div className={`card ${cardDarkMode}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Split Details
              </h3>
              <button
                onClick={() => setShowSplitSidebar(true)}
                className="btn btn-secondary flex items-center gap-2 text-sm"
                disabled={isUpdatingSplit}
              >
                <Edit3 className="h-4 w-4" />
                Edit Split
              </button>
            </div>
            <div className="space-y-3">
              {expense.shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        {share.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{share.user.name}</p>
                      <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>{share.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ${(typeof share.amountOwed === 'string' ? parseFloat(share.amountOwed) : share.amountOwed || 0).toFixed(2)}
                    </div>
                    <div className={`text-xs text-gray-500 ${cardTextDarkMode}`}>
                      {((typeof share.amountOwed === 'string' && typeof expense.amount === 'string' ? (parseFloat(share.amountOwed) / parseFloat(expense.amount)) : share.amountOwed / expense.amount || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`card ${cardDarkMode}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-gray-600 ${cardTextDarkMode}`}>Total Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-gray-600 ${cardTextDarkMode}`}>Split Type</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                  {expense.split.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-gray-600 ${cardTextDarkMode}`}>Participants</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {expense.shares.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-gray-600 ${cardTextDarkMode}`}>Average per person</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${((typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount || 0) / expense.shares.length).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className={`card ${cardDarkMode}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Information
            </h3>
            <div className="space-y-2">
              <div>
                <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>Created</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {dayjs(expense.createdAt).format('MMMM D, YYYY')}
                </p>
              </div>
              <div>
                <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>Time</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {dayjs(expense.createdAt).format('h:mm A')}
                </p>
              </div>
              <div>
                <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>Days ago</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {dayjs().diff(dayjs(expense.createdAt), 'day')} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Split Sidebar */}
      {group && expense && (
        <ChangeSplitSidebar
          isOpen={showSplitSidebar}
          onClose={() => setShowSplitSidebar(false)}
          currentShares={expense.shares}
          members={group.members}
          totalAmount={typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount || 0}
          onSplitChange={handleSplitChange}
          isLoading={isUpdatingSplit}
        />
      )}
    </div>
  )
}

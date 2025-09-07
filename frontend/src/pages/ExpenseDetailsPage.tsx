import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ArrowLeft, DollarSign, Users, Calendar, User, Receipt, Edit3, Trash2 } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import ChangeSplitSidebar from '../components/ChangeSplitSidebar'
import {socketService} from "@/lib/socket";

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
    amountPaid: number
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
  const [showSplitSidebar, setShowSplitSidebar] = useState(false)
  const [isUpdatingSplit, setIsUpdatingSplit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: expense, isLoading, error, refetch } = useQuery({
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

  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/groups/${groupId}/expenses/${expenseId}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Expense deleted successfully!')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      // Navigate back to group page
      navigate(`/groups/${groupId}`)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete expense'
      toast.error(errorMessage)
    }
  })

   // Socket.IO setup
   useEffect(() => {
    if (groupId) {
      socketService.joinGroup(groupId)
      
      const onExpenseUpdated = () => {
        refetch()
      }

      socketService.onExpenseUpdated(onExpenseUpdated)

      return () => {
        socketService.leaveGroup(groupId)
        socketService.off('expense-updated', refetch)
      }
    }
  }, [groupId, refetch])

  const handleSplitChange = async (splitType: string, newShares: { userId: string; amountPaid: number }[]) => {
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
            amountPaid: share.amountPaid,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          }
        }).filter(Boolean) as typeof oldData.shares

        return {
          ...oldData,
          split: splitType,
          shares: updatedShares
        }
      })

      // API call
      await api.put(`/groups/${groupId}/expenses/${expenseId}/split`, {
        split: splitType,
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

  const handleDeleteExpense = async () => {
    setIsDeleting(true)
    try {
      await deleteExpenseMutation.mutateAsync()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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
      <div className="flex items-center justify-between">
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
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-danger flex items-center gap-2"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete Expense
        </button>
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
                      ${(typeof share.amountPaid === 'string' ? parseFloat(share.amountPaid) : share.amountPaid || 0).toFixed(2)}
                    </div>
                    <div className={`text-xs text-gray-500 ${cardTextDarkMode}`}>
                      {((typeof share.amountPaid === 'string' && typeof expense.amount === 'string' ? (parseFloat(share.amountPaid) / parseFloat(expense.amount)) : share.amountPaid / expense.amount || 0) * 100).toFixed(1)}%
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
              <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Expense
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this expense? This action cannot be undone.
                      </p>
                      {expense && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ${(typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount || 0).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleDeleteExpense}
                    disabled={isDeleting}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

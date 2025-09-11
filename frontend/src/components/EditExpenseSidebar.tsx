import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, Save, DollarSign, Users, Check, Plus } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'
import { createExpenseSchema, type CreateExpenseForm } from '../schemas/expense'
import { truncateEmailExtra } from '../utils/emailUtils'

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

interface Payer {
  id: string
  amount: number
  user: {
    id: string
    name: string
    email: string
  }
}

interface Share {
  id: string
  amountOwed: number
  user: {
    id: string
    name: string
    email: string
  }
}

interface Expense {
  id: string
  description: string
  amount: number
  split: string
  createdAt: string
  payers: Payer[]
  shares: Share[]
}

interface EditExpenseSidebarProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense
  members: Member[]
  groupId: string
  onSuccess?: () => void
}

// Using CreateExpenseForm type from schema instead of local interface

export default function EditExpenseSidebar({
  isOpen,
  onClose,
  expense,
  members,
  groupId,
  onSuccess
}: EditExpenseSidebarProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [payers, setPayers] = useState<Array<{ userId: string; amount: number }>>([])
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    mode: 'onBlur',
    defaultValues: {
      description: expense.description,
      amount: Number(expense.amount),
      split: expense.split as 'EQUAL' | 'CUSTOM',
      shares: expense.shares.map(share => ({
        userId: share.user.id,
        amountOwed: Number(share.amountOwed)
      })),
      payers: expense.payers.map(payer => ({
        userId: payer.user.id,
        amount: Number(payer.amount)
      }))
    }
  })

  const watchedAmount = watch('amount')
  const watchedSplit = watch('split')

  // Payer management functions
  const addPayer = () => {
    if (members.length > 0) {
      setPayers([...payers, { userId: members[0].user.id, amount: 0 }])
    }
  }

  const removePayer = (index: number) => {
    setPayers(payers.filter((_, i) => i !== index))
  }

  const updatePayer = (index: number, field: 'userId' | 'amount', value: string | number) => {
    const newPayers = [...payers]
    newPayers[index] = {
      ...newPayers[index],
      [field]: field === 'amount' ? Number(value) : value
    }
    setPayers(newPayers)
  }

  const getTotalPaidAmount = () => {
    return payers.reduce((total, payer) => total + (payer.amount || 0), 0)
  }

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
      // Ensure all numeric values are properly converted to numbers
      const processedShares = expense.shares.map(share => ({
        userId: share.user.id,
        amountOwed: Number(share.amountOwed)
      }))
      
      reset({
        description: expense.description,
        amount: Number(expense.amount),
        split: expense.split as 'EQUAL' | 'CUSTOM',
        shares: processedShares,
        payers: expense.payers.map(payer => ({
          userId: payer.user.id,
          amount: Number(payer.amount)
        }))
      })
      setSplitType(expense.split as 'EQUAL' | 'CUSTOM')
      
      // Initialize selected members from current shares
      const memberIds = new Set(expense.shares.map(share => share.user.id))
      setSelectedMembers(memberIds)
      
      // Initialize payers
      setPayers(expense.payers.map(payer => ({
        userId: payer.user.id,
        amount: Number(payer.amount)
      })))
      
    }
  }, [expense, reset])

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: CreateExpenseForm) => {
      const response = await api.put(`/groups/${groupId}/expenses/${expense.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', expense.id] })
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('Expense updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update expense')
    }
  })

  const onSubmit = async (data: CreateExpenseForm) => {
    setIsSubmitting(true)
    try {
      // Only include selected members
      const selectedMembersList = members.filter(member => selectedMembers.has(member.user.id))
      
      if (selectedMembersList.length === 0) {
        toast.error('Please select at least one member for the expense')
        return
      }

      if (payers.length === 0) {
        toast.error('Please add at least one payer for the expense')
        return
      }

      const totalPaid = getTotalPaidAmount()
      if (Math.abs(totalPaid - data.amount) > 0.01) {
        toast.error(`Total paid amount ($${totalPaid.toFixed(2)}) must equal the expense amount ($${data.amount.toFixed(2)})`)
        return
      }

      // Set payers data
      data.payers = payers

      // Calculate shares for equal split
      if (data.split === 'EQUAL' && data.amount && selectedMembersList.length > 0) {
        const amountPerPerson = data.amount / selectedMembersList.length
        data.shares = selectedMembersList.map(member => ({
          userId: member.user.id,
          amountOwed: amountPerPerson
        }))
      } else if (data.split === 'CUSTOM') {
        // Include all selected members, even if they have $0 amount
        data.shares = selectedMembersList.map(member => {
          const existingShare = data.shares.find(share => share.userId === member.user.id)
          return {
            userId: member.user.id,
            amountOwed: existingShare ? Number(existingShare.amountOwed) : 0
          }
        })
      }

      await updateExpenseMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMemberToggle = (userId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedMembers(newSelected)
  }

  const updateCustomShare = (userId: string, amount: number) => {
    const currentShares = watch('shares') || []
    const existingIndex = currentShares.findIndex(share => share.userId === userId)
    
    if (existingIndex >= 0) {
      const newShares = [...currentShares]
      newShares[existingIndex] = { userId, amountOwed: amount }
      setValue('shares', newShares)
    } else {
      setValue('shares', [...currentShares, { userId, amountOwed: amount }])
    }
  }

  const getCustomShare = (userId: string) => {
    const shares = watch('shares') || []
    const share = shares.find(s => s.userId === userId)
    return share?.amountOwed || 0
  }

  const calculateTotal = () => {
    const selectedMembersList = members.filter(member => selectedMembers.has(member.user.id))
    const total = selectedMembersList.reduce((sum, member) => sum + Number(getCustomShare(member.user.id)), 0)
    return Math.round(total * 100) / 100
  }

  const getSelectedMembersCount = () => {
    return selectedMembers.size
  }

  const handleClose = () => {
    // Ensure all numeric values are properly converted to numbers
    const processedShares = expense.shares.map(share => ({
      userId: share.user.id,
      amountOwed: Number(share.amountOwed)
    }))
    
    reset({
      description: expense.description,
      amount: Number(expense.amount),
      split: expense.split as 'EQUAL' | 'CUSTOM',
      shares: processedShares,
      payers: expense.payers.map(payer => ({
        userId: payer.user.id,
        amount: Number(payer.amount)
      }))
    })
    setSplitType(expense.split as 'EQUAL' | 'CUSTOM')
    
    // Initialize selected members from current shares
    const memberIds = new Set(expense.shares.map(share => share.user.id))
    setSelectedMembers(memberIds)
    
      // Reset payers
      setPayers(expense.payers.map(payer => ({
        userId: payer.user.id,
        amount: Number(payer.amount)
      })))
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Expense
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  {...register('description')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Dinner at restaurant"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              {/* Multiple Payers Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Who paid? ({payers.length} payer{payers.length !== 1 ? 's' : ''})
                  </label>
                  <button
                    type="button"
                    onClick={addPayer}
                    className="btn btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Payer
                  </button>
                </div>
                
                {payers.length > 0 && (
                  <div className="space-y-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {payers.map((payer, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <select
                            value={payer.userId}
                            onChange={(e) => updatePayer(index, 'userId', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {members.map((member) => (
                              <option key={member.user.id} value={member.user.id}>
                                {member.user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={payer.amount || ''}
                            onChange={(e) => updatePayer(index, 'amount', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePayer(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {payers.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Total paid:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ${getTotalPaidAmount().toFixed(2)}
                      </span>
                    </div>
                    {Math.abs(getTotalPaidAmount() - watchedAmount) > 0.01 && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Must equal expense amount (${watchedAmount?.toFixed(2) || '0.00'})
                      </div>
                    )}
                  </div>
                )}

                {errors.payers && (
                  <p className="mt-1 text-sm text-red-600">{errors.payers.message}</p>
                )}
              </div>

              {/* Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include Members ({getSelectedMembersCount()}/{members.length})
                  </label>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {members.map((member) => (
                    <button
                      key={member.user.id}
                      type="button"
                      onClick={() => handleMemberToggle(member.user.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        selectedMembers.has(member.user.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      disabled={isSubmitting}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                          {member.user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.user.name}
                        </p>
                        <p 
                          className={`text-sm text-gray-500 ${cardTextDarkMode}`}
                          title={member.user.email}
                        >
                          {truncateEmailExtra(member.user.email)}
                        </p>
                      </div>
                      {selectedMembers.has(member.user.id) && (
                        <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Split Type
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitType('EQUAL')
                      setValue('split', 'EQUAL')
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      watchedSplit === 'EQUAL'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Users className="h-5 w-5 text-primary-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Equal Split</p>
                      <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>
                        Divide equally among selected members
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitType('CUSTOM')
                      setValue('split', 'CUSTOM')
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      watchedSplit === 'CUSTOM'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <DollarSign className="h-5 w-5 text-primary-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Custom Amounts</p>
                      <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>
                        Set individual amounts for each member
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Equal Split Preview */}
              {watchedSplit === 'EQUAL' && watchedAmount && getSelectedMembersCount() > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Equal Split Preview</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Each person pays: <span className="font-semibold">${(watchedAmount / getSelectedMembersCount()).toFixed(2)}</span>
                    <span className="text-xs text-gray-500 ml-2">({getSelectedMembersCount()} members)</span>
                  </p>
                </div>
              )}

              {/* Custom Amounts */}
              {watchedSplit === 'CUSTOM' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Custom Amounts</h4>
                  <div className="space-y-3">
                    {members
                      .filter(member => selectedMembers.has(member.user.id))
                      .map((member) => (
                        <div key={member.user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                                {member.user.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              value={getCustomShare(member.user.id)}
                              onChange={(e) => updateCustomShare(member.user.id, parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                  {watchedAmount && (
                    <div className={`mt-3 text-sm text-gray-600 dark:${cardTextDarkMode}`}>
                      Total: ${calculateTotal()}
                      {Number(watchedAmount) !== calculateTotal() && (
                        <span className="text-red-600 dark:text-red-400 ml-2">(Amounts don't match total)</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, Plus, Minus, Check } from 'lucide-react'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";
import { createExpenseSchema, type CreateExpenseForm } from '../schemas/expense'

interface ExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groupId: string
  groupMembers: Array<{
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

// Using ExpenseForm type from schema instead of local interface

export default function AddExpenseModal({ isOpen, onClose, onSuccess, groupId, groupMembers }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [payers, setPayers] = useState<Array<{ userId: string; amount: number }>>([])
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    mode: 'onBlur',
    defaultValues: {
      description: '',
      amount: 0,
      split: 'EQUAL',
      shares: [],
      payers: []
    }
  })

  const watchedAmount = watch('amount')
  const watchedSplit = watch('split')

  // Initialize selected members when modal opens
  useEffect(() => {
    if (isOpen && groupMembers.length > 0) {
      // Select all members by default
      setSelectedMembers(new Set(groupMembers.map(member => member.user.id)))
    }
  }, [isOpen, groupMembers])

  const createExpenseMutation = useMutation({
    mutationFn: async (data: CreateExpenseForm) => {
      const response = await api.post(`/groups/${groupId}/expenses`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      toast.success('Expense added successfully!')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add expense')
    }
  })

  const onSubmit = async (data: CreateExpenseForm) => {
    setIsSubmitting(true)
    try {
      // Only include selected members
      const selectedMembersList = groupMembers.filter(member => selectedMembers.has(member.user.id))
      
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
        const selectedMembersList = groupMembers.filter(member => selectedMembers.has(member.user.id))
        data.shares = selectedMembersList.map(member => {
          const existingShare = data.shares.find(share => share.userId === member.user.id)
          return {
            userId: member.user.id,
            amountOwed: existingShare ? existingShare.amountOwed : 0
          }
        })
      }

      await createExpenseMutation.mutateAsync(data)
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

  const updateShareInBundle = useCallback((newMembers?: Set<string>) => {
    if (watchedSplit === "CUSTOM" && newMembers) {
      const currentShares = watch('shares') || []
      const newShares = []
      
      // Include all selected members, preserving existing amounts or defaulting to 0
      for (const memberId of newMembers) {
        const existingShare = currentShares.find(share => share.userId === memberId)
        newShares.push({
          userId: memberId,
          amountOwed: existingShare ? existingShare.amountOwed : 0
        })
      }
      
      setValue("shares", newShares)
    }
  }, [watchedSplit, watch, setValue])

  // Update shares when split type changes
  useEffect(() => {
    if (watchedSplit === "CUSTOM" && selectedMembers.size > 0) {
      updateShareInBundle(selectedMembers)
    } else if (watchedSplit === "EQUAL") {
      // Clear custom shares when switching to equal split
      setValue("shares", [])
    }
  }, [watchedSplit, selectedMembers, setValue, updateShareInBundle])

  const handleSelectAll = () => {
    const newMembers = new Set(groupMembers.map(member => member.user.id))
    setSelectedMembers(newMembers)
    updateShareInBundle(newMembers)
  }

  const handleSelectNone = () => {
    setSelectedMembers(new Set())
    if (watchedSplit === "CUSTOM") {
      setValue("shares", [])
    }
  }

  const handleClose = () => {
    reset()
    setSplitType('EQUAL')
    setSelectedMembers(new Set())
    setPayers([])
    onClose()
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
    const selectedMembersList = groupMembers.filter(member => selectedMembers.has(member.user.id))
    const total = selectedMembersList.reduce((sum, member) => sum + getCustomShare(member.user.id), 0)
    return Math.round(total * 100) / 100
  }

  // Payer management functions
  const addPayer = () => {
    if (groupMembers.length > 0) {
      setPayers([...payers, { userId: groupMembers[0].user.id, amount: 0 }])
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

  const getSelectedMembersCount = () => {
    return selectedMembers.size
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
              <button
                onClick={handleClose}
                className={`text-gray-400 hover:text-gray-600 ${cardTextDarkMode}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    {...register('description')}
                    type="text"
                    className={`input ${cardDarkMode}`}
                    placeholder="e.g., Dinner at restaurant"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`input ${cardDarkMode}`}
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              {/* Multiple Payers Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
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
                            {groupMembers.map((member) => (
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
                  <label className="block text-sm font-medium text-gray-700">
                    Include Members ({getSelectedMembersCount()}/{groupMembers.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleSelectNone}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Select None
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {groupMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.user.id)}
                        onChange={() => {
                          handleMemberToggle(member.user.id)
                          // NOTE: when trigger together, the latest function can't obtain the new state for selectedMembers, so call inside the handleMemberToggle function and pass the new state to the latest function
                          // updateCustomShareToIncludeSelectedMember(member.user.id)
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
                          {member.user.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Split Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      {...register('split')}
                      type="radio"
                      value="EQUAL"
                      checked={splitType === 'EQUAL'}
                      onChange={(e) => setSplitType(e.target.value as 'EQUAL' | 'CUSTOM')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Equal split</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('split')}
                      type="radio"
                      value="CUSTOM"
                      checked={splitType === 'CUSTOM'}
                      onChange={(e) => setSplitType(e.target.value as 'EQUAL' | 'CUSTOM')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Custom amounts</span>
                  </label>
                </div>
              </div>

              {/* {splitType === 'EQUAL' && watchedAmount !== null || watchedAmount !== undefined && getSelectedMembersCount() > 0 && ( */}
              {splitType === 'EQUAL' && typeof watchedAmount === 'number' && watchedAmount > 0 && getSelectedMembersCount() > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Equal Split Preview</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Each person pays: <span className="font-semibold">${(watchedAmount / getSelectedMembersCount()).toFixed(2)}</span>
                    <span className="text-xs text-gray-500 ml-2">({getSelectedMembersCount()} members)</span>
                  </p>
                </div>
              )}

              {splitType === 'CUSTOM' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Custom Amounts</h4>
                  <div className="space-y-3">
                    {groupMembers
                      .filter(member => selectedMembers.has(member.user.id))
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
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
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                  {/* {watchedAmount !== null || watchedAmount !== undefined */}
                  {typeof watchedAmount === 'number' && watchedAmount > 0 && (
                    <div className={`mt-3 text-sm text-gray-600 dark:${cardTextDarkMode}`}>
                      Total: ${calculateTotal()}
                      {Number(watchedAmount as any as string) !== calculateTotal() && (
                        <span className="text-red-600 dark:text-red-400 ml-2">(Amounts don't match total)</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

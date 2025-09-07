import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, Plus, Minus } from 'lucide-react'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";

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

interface ExpenseFormData {
  description: string
  amount: number
  split: 'EQUAL' | 'CUSTOM'
  shares: Array<{
    userId: string
    amountOwed: number
  }>
}

export default function CreateExpenseModal({ isOpen, onClose, onSuccess, groupId, groupMembers }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL')
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      split: 'EQUAL',
      shares: []
    }
  })

  const watchedAmount = watch('amount')

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
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

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      // Calculate shares for equal split
      if (data.split === 'EQUAL' && data.amount && groupMembers.length > 0) {
        const amountPerPerson = data.amount / groupMembers.length
        data.shares = groupMembers.map(member => ({
          userId: member.user.id,
          amountOwed: amountPerPerson
        }))
      }

      await createExpenseMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setSplitType('EQUAL')
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
    const total = groupMembers.reduce((sum, member) => sum + getCustomShare(member.user.id), 0)
    return Math.round(total * 100) / 100
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
                    {...register('description', { required: 'Description is required' })}
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
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' }
                    })}
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

              {splitType === 'EQUAL' && watchedAmount && groupMembers.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Equal Split Preview</h4>
                  <p className="text-sm text-gray-600">
                    Each person pays: <span className="font-semibold">${(watchedAmount / groupMembers.length).toFixed(2)}</span>
                  </p>
                </div>
              )}

              {splitType === 'CUSTOM' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Amounts</h4>
                  <div className="space-y-3">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {member.user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{member.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={getCustomShare(member.user.id)}
                            onChange={(e) => updateCustomShare(member.user.id, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {watchedAmount && (
                    <div className="mt-3 text-sm text-gray-600">
                      Total: ${calculateTotal()}

                      {Number(watchedAmount as any as string) !== calculateTotal() && (
                        <span className="text-red-600 ml-2">(Amounts don't match total)</span>
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

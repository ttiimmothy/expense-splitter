import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, Save, Users, DollarSign } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'
import { editGroupSchema, type EditGroupForm } from '../schemas/group'
import {CURRENCIES} from "@/constants/currencies";

interface EditGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groupId: string
  currentName: string
  currentCurrency: string
}

export default function EditGroupModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  currentName,
  currentCurrency
}: EditGroupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditGroupForm>({
    resolver: zodResolver(editGroupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: currentName,
      currency: currentCurrency
    }
  })

  // Reset form when modal opens/closes or when current values change
  useEffect(() => {
    if (isOpen) {
      reset({
        name: currentName,
        currency: currentCurrency
      })
    }
  }, [isOpen, currentName, currentCurrency, reset])

  const updateGroupMutation = useMutation({
    mutationFn: async (data: EditGroupForm) => {
      const response = await api.put(`/groups/${groupId}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Group updated successfully!')
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to update group'
      toast.error(errorMessage)
    }
  })

  const onSubmit = async (data: EditGroupForm) => {
    setIsSubmitting(true)
    try {
      await updateGroupMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Group</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update group details</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`input ${cardDarkMode} ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter group name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <div className="relative">
                  <select
                    {...register('currency')}
                    className={`input ${cardDarkMode} ${errors.currency ? 'border-red-500' : ''} pr-10`}
                    disabled={isSubmitting}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency.message}</p>
                )}
              </div>

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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Group
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

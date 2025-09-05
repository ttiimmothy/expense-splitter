import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, Plus } from 'lucide-react'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateGroupForm {
  name: string
  currency: string
}

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
]

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateGroupForm>()

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await api.post('/groups', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group created successfully!')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create group')
    }
  })

  const onSubmit = async (data: CreateGroupForm) => {
    setIsSubmitting(true)
    try {
      await createGroupMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className={"relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"}>
          <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
              <button
                onClick={handleClose}
                className={`${cardTextDarkMode} text-gray-400 hover:text-gray-600`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  {...register('name', { 
                    required: 'Group name is required',
                    minLength: { value: 1, message: 'Group name cannot be empty' }
                  })}
                  type="text"
                  className={`input ${cardDarkMode}`}
                  placeholder="e.g., Trip to Japan"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  {...register('currency', { required: 'Currency is required' })}
                  className={`input ${cardDarkMode}`}
                  defaultValue="USD"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> You'll be automatically added as the group owner. 
                  You can invite other members after creating the group.
                </p>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Group
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

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, UserPlus } from 'lucide-react'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groupId: string
}

interface InviteForm {
  userEmail: string
}

export default function InviteMemberModal({ isOpen, onClose, onSuccess, groupId }: InviteMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>()

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteForm) => {
      const response = await api.post(`/groups/${groupId}/invite`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Member invited successfully!')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to invite member'
      toast.error(errorMessage)
    }
  })

  const onSubmit = async (data: InviteForm) => {
    setIsSubmitting(true)
    try {
      await inviteMemberMutation.mutateAsync(data)
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
        
        <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Member</h3>
              <button
                onClick={handleClose}
                className={`text-gray-400 hover:text-gray-600 ${cardTextDarkMode}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...register('userEmail', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input ${cardDarkMode}`}
                  placeholder="Enter member's email address"
                />
                {errors.userEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.userEmail.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> The user must already have an account to be added to the group. 
                  If they don't have an account, they'll need to register first.
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
                      Inviting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Send Invite
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

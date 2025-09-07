import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, UserPlus, Search, ChevronDown, Check } from 'lucide-react'
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

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export default function InviteMemberModal({ isOpen, onClose, onSuccess, groupId }: InviteMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailQuery, setEmailQuery] = useState('')
  const [showEmailDropdown, setShowEmailDropdown] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<User | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<InviteForm>()

  const emailValue = watch('userEmail')

  // Fetch available users by email search
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['available-users', groupId, emailQuery],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/available-users?search=${encodeURIComponent(emailQuery)}`)
      return response.data as User[]
    },
    enabled: isOpen && emailQuery.length >= 2,
    staleTime: 30000 // Cache for 30 seconds
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEmailDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update email query when email value changes
  useEffect(() => {
    setEmailQuery(emailValue || '')
    setShowEmailDropdown((emailValue || '').length >= 2)
  }, [emailValue])

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteForm) => {
      const response = await api.post(`/groups/${groupId}/invite`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Member invited successfully!')
      reset()
      setSelectedEmail(null)
      setEmailQuery('')
      setShowEmailDropdown(false)
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

  const handleEmailSelect = (user: User) => {
    setSelectedEmail(user)
    setValue('userEmail', user.email)
    setShowEmailDropdown(false)
  }

  const handleClose = () => {
    reset()
    setSelectedEmail(null)
    setEmailQuery('')
    setShowEmailDropdown(false)
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
              <div className="relative" ref={dropdownRef}>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    {...register('userEmail', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className={`input ${cardDarkMode} pr-10`}
                    placeholder="Enter member's email address"
                    autoComplete="off"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                {/* Selected User Display */}
                {selectedEmail && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600 dark:text-green-300">
                          {selectedEmail.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">{selectedEmail.name}</p>
                        <p className="text-sm text-green-700 dark:text-green-300">{selectedEmail.email}</p>
                      </div>
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                )}

                {/* Email Dropdown */}
                {showEmailDropdown && emailQuery.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {usersLoading ? (
                      <div className="p-3 text-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                      </div>
                    ) : availableUsers.length > 0 ? (
                      availableUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleEmailSelect(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No users found</p>
                        <p className="text-xs mt-1">Try a different email address</p>
                      </div>
                    )}
                  </div>
                )}

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

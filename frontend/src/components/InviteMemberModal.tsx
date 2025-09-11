import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { X, UserPlus, Search, ChevronDown, Check, Plus, Trash2 } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from "@/constants/colors"
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteMultipleMembersSchema, type InviteMultipleMembersForm } from '../schemas/group'

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
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [emailInputs, setEmailInputs] = useState<string[]>([''])
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([])
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<InviteMultipleMembersForm>({
    resolver: zodResolver(inviteMultipleMembersSchema),
    mode: 'onBlur',
    defaultValues: {
      userEmails: ['']
    }
  })

  const watchedEmails = watch('userEmails')

  // Fetch available users by email search
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['available-users', groupId, emailQuery],
    queryFn: async () => {
      const response = await api(`/groups/${groupId}/available-users?search=${encodeURIComponent(emailQuery)}`)
      return response.data as User[]
    },
    enabled: isOpen && emailQuery.length >= 2 && activeDropdownIndex !== null,
    staleTime: 30000 // Cache for 30 seconds
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const activeRef = activeDropdownIndex !== null ? dropdownRefs.current[activeDropdownIndex] : null
      if (activeRef && !activeRef.contains(event.target as Node)) {
        setShowEmailDropdown(false)
        setActiveDropdownIndex(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdownIndex])

  // Update email inputs when form values change
  useEffect(() => {
    setEmailInputs(watchedEmails || [''])
  }, [watchedEmails])

  const inviteMembersMutation = useMutation({
    mutationFn: async (data: InviteMultipleMembersForm) => {
      // Filter out empty emails and send multiple invitations
      const validEmails = data.userEmails.filter(email => email.trim() !== '')
      const response = await api.post(`/groups/${groupId}/invite`, { userEmails: validEmails })
      return response.data
    },
    onSuccess: (data) => {
      const invitedCount = data?.invitedCount || 0
      const failedCount = data?.failedCount || 0
      
      if (invitedCount > 0) {
        toast.success(`${invitedCount} member${invitedCount > 1 ? 's' : ''} invited successfully!`)
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} invitation${failedCount > 1 ? 's' : ''} failed`)
      }
      
      reset()
      setSelectedUsers([])
      setEmailInputs([''])
      setEmailQuery('')
      setShowEmailDropdown(false)
      setActiveDropdownIndex(null)
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to invite members'
      toast.error(errorMessage)
    }
  })
  // console.log(watchedEmails)

  const onSubmit = async (data: InviteMultipleMembersForm) => {
    setIsSubmitting(true)
    try {
      await inviteMembersMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addEmailInput = () => {
    if (emailInputs.length < 10) {
      const newInputs = [...emailInputs, '']
      setEmailInputs(newInputs)
      setValue('userEmails', newInputs)
    }
  }

  const removeEmailInput = (index: number) => {
    if (emailInputs.length > 1) {
      const newInputs = emailInputs.filter((_, i) => i !== index)
      setEmailInputs(newInputs)
      setValue('userEmails', newInputs)
    }
  }

  const updateEmailInput = (index: number, value: string) => {
    const newInputs = [...emailInputs]
    newInputs[index] = value
    setEmailInputs(newInputs)
    setValue('userEmails', newInputs)
    
    // Update search query and show dropdown if typing
    setEmailQuery(value)
    if (value.length >= 2) {
      setActiveDropdownIndex(index)
      setShowEmailDropdown(true)
    } else {
      setShowEmailDropdown(false)
      setActiveDropdownIndex(null)
    }
  }

  const handleEmailSelect = (user: User) => {
    if (activeDropdownIndex !== null) {
      updateEmailInput(activeDropdownIndex, user.email)
      
      // Add to selected users
      const newSelectedUsers = [...selectedUsers]
      newSelectedUsers[activeDropdownIndex] = user
      setSelectedUsers(newSelectedUsers)
      
      setShowEmailDropdown(false)
      setActiveDropdownIndex(null)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedUsers([])
    setEmailInputs([''])
    setEmailQuery('')
    setShowEmailDropdown(false)
    setActiveDropdownIndex(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite Members</h3>
              <button
                onClick={handleClose}
                className={`text-gray-400 hover:text-gray-600 ${cardTextDarkMode}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Email Addresses
                </label>
                <div className="space-y-3">
                  {emailInputs.map((email, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative" ref={(el) => { dropdownRefs.current[index] = el }}>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => updateEmailInput(index, e.target.value)}
                            className={`input ${cardDarkMode} pr-10`}
                            placeholder="Enter member's email address"
                            autoComplete="off"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          
                          {/* Email Dropdown */}
                          {showEmailDropdown && activeDropdownIndex === index && emailQuery.length >= 2 && (
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
                        </div>
                        {emailInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailInput(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Selected User Display */}
                      {selectedUsers[index] && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600 dark:text-green-300">
                                {selectedUsers[index].name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-green-900 dark:text-green-100">{selectedUsers[index].name}</p>
                              <p className="text-sm text-green-700 dark:text-green-300">{selectedUsers[index].email}</p>
                            </div>
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {emailInputs.length < 10 && (
                    <button
                      type="button"
                      onClick={addEmailInput}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-800 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add another email
                    </button>
                  )}
                </div>

                {errors.userEmails && (
                  <p className="mt-2 text-sm text-red-600">{errors.userEmails.message}</p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Users must already have an account to be added to the group. 
                  You can invite up to 10 members at once. If they don't have an account, they'll need to register first.
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
                      Sending Invites...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Send Invites
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

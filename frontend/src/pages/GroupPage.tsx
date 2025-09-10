import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import { socketService } from '../lib/socket'
import { Plus, Users, DollarSign, ArrowLeft, Trash2, AlertTriangle, Crown, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'react-hot-toast'
import { truncateEmailMedium } from '../utils/emailUtils'
import CreateExpenseModal from '../components/CreateExpenseModal'
import ExpenseTable from '../components/ExpenseTable'
import InviteMemberModal from '../components/InviteMemberModal'
import SettlementList from '../components/SettlementList'
import SettlementDetailsModal from '../components/SettlementDetailsModal'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";

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

interface Settlement {
  id: string
  amount: number
  createdAt: string
  fromUser: {
    id: string
    name: string
    email: string
  }
  toUser: {
    id: string
    name: string
    email: string
  }
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showOwnerAssignConfirm, setShowOwnerAssignConfirm] = useState(false)
  const [memberToAssignOwner, setMemberToAssignOwner] = useState<{ id: string; name: string } | null>(null)
  const [isAssigningOwner, setIsAssigningOwner] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: group, isLoading: groupLoading, refetch } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const response = await api(`/groups/${id}`)
      return response.data.group as Group
    },
    enabled: !!id
  })

  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const response = await api(`/groups/${id}/expenses`)
      return response.data.expenses as Expense[]
    },
    enabled: !!id
  })

  const { data: settlements, isLoading: settlementsLoading, refetch: refetchSettlements } = useQuery({
    queryKey: ['settlements', id],
    queryFn: async () => {
      const response = await api(`/groups/${id}/settlements`)
      return response.data as Settlement[]
    },
    enabled: !!id
  })

  // Socket.IO setup
  useEffect(() => {
    if (id) {
      socketService.connect()
      socketService.joinGroup(id)
      
      const onExpenseCreated = () => {
        refetchExpenses()
      }

      const onGroupUpdated = () => {
        refetch()
      }

      const onSettlementCreated = () => {
        refetchSettlements()
      }

      socketService.onExpenseCreated(onExpenseCreated)
      socketService.onGroupUpdated(onGroupUpdated)
      socketService.onSettlementCreated(onSettlementCreated)

      return () => {
        socketService.leaveGroup(id)
        socketService.off('expense-created', onExpenseCreated)
        socketService.off('group-updated', onGroupUpdated)
        socketService.off('settlement-created', onSettlementCreated)
      }
    }
  }, [id, refetchExpenses, refetch, refetchSettlements])

  const handleSettlementClick = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setShowSettlementModal(true)
  }

  const handleCloseSettlementModal = () => {
    setShowSettlementModal(false)
    setSelectedSettlement(null)
  }

  // Check if current user is the group owner
  const isOwner = group?.members.some(member => 
    member.user.id === user?.id && member.role === 'OWNER'
  )

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await api.delete(`/groups/${id}/members/${memberId}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Member removed successfully!')
      refetch()
      setShowDeleteConfirm(false)
      setMemberToDelete(null)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to remove member'
      toast.error(errorMessage)
    }
  })

  const handleDeleteMember = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteMemberMutation.mutateAsync(memberToDelete.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setMemberToDelete(null)
  }

  // Assign owner mutation
  const assignOwnerMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await api.put(`/groups/${id}/members/${memberId}/role`, { role: 'OWNER' })
      return response.data
    },
    onSuccess: () => {
      toast.success('Ownership transferred successfully!')
      refetch()
      setShowOwnerAssignConfirm(false)
      setMemberToAssignOwner(null)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to transfer ownership'
      toast.error(errorMessage)
    }
  })

  const handleAssignOwner = (memberId: string, memberName: string) => {
    setMemberToAssignOwner({ id: memberId, name: memberName })
    setShowOwnerAssignConfirm(true)
  }

  const confirmAssignOwner = async () => {
    if (!memberToAssignOwner) return
    
    setIsAssigningOwner(true)
    try {
      await assignOwnerMutation.mutateAsync(memberToAssignOwner.id)
    } finally {
      setIsAssigningOwner(false)
    }
  }

  const handleCloseOwnerAssignConfirm = () => {
    setShowOwnerAssignConfirm(false)
    setMemberToAssignOwner(null)
  }


  if (groupLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Group not found</h3>
        <div className="mt-1 text-gray-500 dark:text-gray-300">The group you're looking for doesn't exist.</div>
        <div className="mt-4">
        <Link to="/" className="btn btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
        </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{group.members.length} members • {group.currency}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Invite
          </button>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="md:col-span-1 xl:col-span-2">
          <div className={`card ${cardDarkMode}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Expenses</h2>
            {expensesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : expenses && expenses.length > 0 ? (
              <ExpenseTable expenses={expenses} groupId={id!} />
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No expenses yet</p>
                <p className="text-sm text-gray-400">Add your first expense to get started</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
        <div className={`card ${cardDarkMode}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Members</h3>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                      {member.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                    <p 
                      className={`text-xs text-gray-500 ${cardTextDarkMode}`}
                      title={member.user.email}
                    >
                      {truncateEmailMedium(member.user.email)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {member.role === 'OWNER' && (
                        <span title="Group Owner">
                          <Crown className="h-3 w-3 text-yellow-500" />
                        </span>
                      )}
                      <span className={`text-xs text-gray-500 ${cardTextDarkMode}`}>{member.role}</span>
                    </div>
                    {isOwner && member.role !== 'OWNER' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAssignOwner(member.id, member.user.name)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title={`Make ${member.user.name} the group owner`}
                        >
                          <Crown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.user.name)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={`Remove ${member.user.name} from group`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`card ${cardDarkMode}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Settlements</h3>
            <SettlementList 
              settlements={settlements || []} 
              isLoading={settlementsLoading}
              currency={group.currency}
              onSettlementClick={handleSettlementClick}
            />
          </div>

          <div className={`card ${cardDarkMode}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to={`/groups/${id}/settle`}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={()=>{queryClient.invalidateQueries({queryKey:["balances"]})}}
              >
                View Balances & Settle
              </Link>
              <button
                onClick={() => setShowInviteModal(true)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Invite Members
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateExpenseModal
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        groupId={id!}
        groupMembers={group.members}
        onSuccess={() => {
          setShowExpenseForm(false)
          refetchExpenses()
        }}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupId={id!}
        onSuccess={() => {
          setShowInviteModal(false)
          // Refetch group data to update members
          refetch()
          // window.location.reload()
        }}
      />

      <SettlementDetailsModal
        isOpen={showSettlementModal}
        onClose={handleCloseSettlementModal}
        settlement={selectedSettlement}
        currency={group?.currency || 'USD'}
      />

      {/* Delete Member Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseDeleteConfirm} />
            
            <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
              <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Remove Member</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Are you sure you want to remove <span className="font-medium">{memberToDelete?.name}</span> from this group?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    They will lose access to all group expenses and settlements.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseDeleteConfirm}
                    className="btn btn-secondary"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteMember}
                    className="btn btn-danger flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Remove Member
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Owner Confirmation Modal */}
      {showOwnerAssignConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseOwnerAssignConfirm} />
            
            <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
              <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transfer Ownership</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Are you sure you want to make <span className="font-medium">{memberToAssignOwner?.name}</span> the new group owner?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    You will become a regular member and lose owner privileges.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseOwnerAssignConfirm}
                    className="btn btn-secondary"
                    disabled={isAssigningOwner}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAssignOwner}
                    className="btn btn-primary flex items-center gap-2"
                    disabled={isAssigningOwner}
                  >
                    {isAssigningOwner ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Transferring...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Transfer Ownership
                      </>
                    )}
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

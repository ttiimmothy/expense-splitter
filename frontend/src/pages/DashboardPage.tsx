import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Plus, Users, DollarSign, Calendar, Trash2, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import CreateGroupModal from '../components/CreateGroupModal'
import GroupCard from '../components/GroupCard'
import {useAuthStore} from "@/stores/authStore";
import {socketService} from "@/lib/socket";
import { toast } from 'react-hot-toast'
import { cardDarkMode } from '@/constants/colors'

interface Group {
  id: string
  name: string
  currency: string
  createdAt: string
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
  _count: {
    expenses: number
    members: number
  }
}

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const {user} = useAuthStore()

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      const response = await api('/groups')
      return response.data.groups as Group[]
    },
  })

  const handleGroupCreated = () => {
    setShowCreateModal(false)
    refetch()
  }

   // Socket.IO setup
   useEffect(() => {
    // Connect to socket
    socketService.connect()
    
    const onGroupUpdated = () => {
      console.log('🔄 Group updated event received, refetching groups...')
      refetch()
    }

    socketService.onGroupUpdated(onGroupUpdated)

    return () => {
      socketService.off('group-updated', onGroupUpdated)
    }
  }, [refetch])

  // Delete group mutation
  // const deleteGroupMutation = useMutation({
  //   mutationFn: async (groupId: string) => {
  //     const response = await api.delete(`/groups/${groupId}`)
  //     return response.data
  //   },
  //   onSuccess: () => {
  //     toast.success('Group deleted successfully!')
  //     refetch()
  //     setShowDeleteGroupConfirm(false)
  //     setGroupToDelete(null)
  //   },
  //   onError: (error: any) => {
  //     const errorMessage = error.response?.data?.error || 'Failed to delete group'
  //     toast.error(errorMessage)
  //   }
  // })

  // const handleDeleteGroup = (groupId: string, groupName: string) => {
  //   setGroupToDelete({ id: groupId, name: groupName })
  //   setShowDeleteGroupConfirm(true)
  // }

  // const confirmDeleteGroup = async () => {
  //   if (!groupToDelete) return
    
  //   setIsDeletingGroup(true)
  //   try {
  //     await deleteGroupMutation.mutateAsync(groupToDelete.id)
  //   } finally {
  //     setIsDeletingGroup(false)
  //   }
  // }

  // const handleCloseDeleteGroupConfirm = () => {
  //   setShowDeleteGroupConfirm(false)
  //   setGroupToDelete(null)
  // }

  // Check if user is owner of a group
  const isGroupOwner = (group: Group) => {
    return group.members.some(member => 
      member.user.id === user?.id && member.role === 'OWNER'
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Groups</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your expense groups and track shared costs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </button>
      </div>

      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              isOwner={isGroupOwner(group)}
              // onDelete={handleDeleteGroup}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new group to split expenses.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Create your first group
              </div>
            </button>
          </div>
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGroupCreated}
      />

      {/* Delete Group Confirmation Modal */}
      {/* {showDeleteGroupConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseDeleteGroupConfirm} />
            
            <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
              <div className={`${cardDarkMode} bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Group</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the group <span className="font-medium">"{groupToDelete?.name}"</span>?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This will permanently delete all expenses, settlements, and member data associated with this group.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseDeleteGroupConfirm}
                    className="btn btn-secondary"
                    disabled={isDeletingGroup}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteGroup}
                    className="btn btn-danger flex items-center gap-2"
                    disabled={isDeletingGroup}
                  >
                    {isDeletingGroup ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Group
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}

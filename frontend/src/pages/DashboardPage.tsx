import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Plus, Users, DollarSign, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import CreateGroupModal from '../components/CreateGroupModal'
import GroupCard from '../components/GroupCard'
import {useAuthStore} from "@/stores/authStore";
import {socketService} from "@/lib/socket";

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
            <GroupCard key={group.id} group={group} />
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
    </div>
  )
}

import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import { socketService } from '../lib/socket'
import { Plus, Users, DollarSign, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import CreateExpenseModal from '../components/CreateExpenseModal'
import ExpenseTable from '../components/ExpenseTable'
import InviteMemberModal from '../components/InviteMemberModal'
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

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: group, isLoading: groupLoading, refetch } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}`)
      return response.data.group as Group
    },
    enabled: !!id
  })

  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}/expenses`)
      return response.data.expenses as Expense[]
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

      socketService.onExpenseCreated(onExpenseCreated)
      socketService.onGroupUpdated(onGroupUpdated)

      return () => {
        socketService.leaveGroup(id)
        socketService.off('expense-created', onExpenseCreated)
        socketService.off('group-updated', onGroupUpdated)
      }
    }
  }, [id, refetchExpenses, refetch])

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
    <div className="space-y-6 min-h-screen">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`card ${cardDarkMode}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {member.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                    <p className={`text-xs text-gray-500 ${cardTextDarkMode}`}>{member.user.email}</p>
                  </div>
                  <span className={`text-xs text-gray-500 ${cardTextDarkMode}`}>{member.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`card ${cardDarkMode}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to={`/groups/${id}/settle`}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={()=>{queryClient.invalidateQueries({queryKey:["balances"]})}}
              >
                View Balances & Settle
              </Link>
              <button
                onClick={() => setShowInviteModal(true)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
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
    </div>
  )
}

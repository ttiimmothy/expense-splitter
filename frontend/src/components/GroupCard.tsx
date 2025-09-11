import { Link } from 'react-router-dom'
import { Users, DollarSign, Calendar, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";

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

interface GroupCardProps {
  group: Group
  isOwner?: boolean
  // onDelete?: (groupId: string, groupName: string) => void
}

export default function GroupCard({ group, isOwner = false }: GroupCardProps) {
  // const handleDeleteClick = (e: React.MouseEvent) => {
  //   e.preventDefault() // Prevent navigation to group page
  //   e.stopPropagation()
  //   if (onDelete) {
  //     onDelete(group.id, group.name)
  //   }
  // }

  return (
    <div className={`card hover:shadow-md transition-shadow duration-200 ${cardDarkMode} relative`}>
      <Link
        to={`/groups/${group.id}`}
        className="block"
      >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
          <p className="text-sm text-gray-500">{group.currency}</p>
        </div>
        <div className="flex -space-x-2">
          {group.members.slice(0, 3).map((member, index) => (
            <div
              key={member.id}
              className="h-8 w-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center"
              style={{ zIndex: 3 - index }}
            >
              <span className="text-xs font-medium text-primary-600">
                {member.user.name.charAt(0)}
              </span>
            </div>
          ))}
          {group.members.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{group.members.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className={`flex items-center gap-2 text-sm text-gray-600 ${cardTextDarkMode}`}>
          <Users className="h-4 w-4" />
          <span>{group._count.members} member{group._count.members !== 1 ? 's' : ''}</span>
        </div>
        
        <div className={`flex items-center gap-2 text-sm text-gray-600 ${cardTextDarkMode}`}>
          <DollarSign className="h-4 w-4" />
          <span>{group._count.expenses} expense{group._count.expenses !== 1 ? 's' : ''}</span>
        </div>
        
        <div className={`flex items-center gap-2 text-sm text-gray-600 ${cardTextDarkMode}`}>
          <Calendar className="h-4 w-4" />
          <span>Created {dayjs(group.createdAt).format('MMM D, YYYY')}</span>
        </div>
      </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-primary-600 font-medium">View Details →</span>
        </div>
      </Link>
      
      {/* {isOwner && onDelete && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-6 right-3 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title={`Delete ${group.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )} */}
    </div>
  )
}

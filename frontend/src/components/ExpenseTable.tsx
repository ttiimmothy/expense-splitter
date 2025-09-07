import {cardDarkMode, cardTextDarkMode} from "@/constants/colors";
import dayjs from 'dayjs'
import { DollarSign, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

interface ExpenseTableProps {
  expenses: Expense[]
  groupId: string
}

export default function ExpenseTable({ expenses, groupId }: ExpenseTableProps) {
  const navigate = useNavigate()

  const handleRowClick = (expenseId: string) => {
    navigate(`/groups/${groupId}/expenses/${expenseId}`)
  }
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No expenses yet</p>
        <p className="text-sm text-gray-400">Add your first expense to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 dark:bg-slate-500`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${cardTextDarkMode}`}>
                Description
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${cardTextDarkMode}`}>
                Amount
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${cardTextDarkMode}`}>
                Split
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${cardTextDarkMode}`}>
                Date
              </th>
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 ${cardDarkMode}`}>
            {expenses.map((expense) => (
              <tr 
                key={expense.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handleRowClick(expense.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">${(typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount || 0).toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center text-sm text-gray-500 ${cardTextDarkMode}`}>
                    <Users className="h-4 w-4 mr-1" />
                    <span className="capitalize">{expense.split.toLowerCase()}</span>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${cardTextDarkMode}`}>
                  {dayjs(expense.createdAt).format('MMM D, YYYY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

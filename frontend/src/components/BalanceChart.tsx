import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface Balance {
  userId: string
  userName: string
  netBalance: number
}

interface BalanceChartProps {
  balances: Balance[]
}

const CREDITOR_COLORS = ['#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#022C22']
const DEBTOR_COLORS = ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A']

export default function BalanceChart({ balances }: BalanceChartProps) {
  // Separate debtors and creditors
  const creditors = balances
    .filter(balance => balance.netBalance > 0.01)
    .map((balance, index) => ({
      name: balance.userName,
      value: balance.netBalance,
      balance: balance.netBalance,
      color: CREDITOR_COLORS[index % CREDITOR_COLORS.length]
    }))

  const debtors = balances
    .filter(balance => balance.netBalance < -0.01)
    .map((balance, index) => ({
      name: balance.userName,
      value: Math.abs(balance.netBalance),
      balance: balance.netBalance,
      color: DEBTOR_COLORS[index % DEBTOR_COLORS.length]
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Balance: <span className={`font-semibold ${data.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.balance > 0 ? '+' : ''}${data.balance.toFixed(2)}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  const ChartLegend = ({ data, title, icon: Icon, color }: { data: any[], title: string, icon: any, color: string }) => (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">({data.length})</span>
      </div>
      {data.length > 0 ? (
        <div className="space-y-1">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
              </div>
              <span className={`font-semibold ${entry.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(entry.balance).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">None</p>
      )}
    </div>
  )

  if (creditors.length === 0 && debtors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No balances to display</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">All balances are settled</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Creditors Chart */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <ArrowUpCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-gray-900 dark:text-white">Creditors (Owed Money)</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">({creditors.length})</span>
        </div>
        {creditors.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={creditors}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {creditors.map((entry, index) => (
                    <Cell key={`creditor-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No creditors</p>
          </div>
        )}
        <ChartLegend 
          data={creditors} 
          title="Creditors" 
          icon={ArrowUpCircle} 
          color="text-green-600" 
        />
      </div>

      {/* Debtors Chart */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <ArrowDownCircle className="h-5 w-5 text-red-600" />
          <h3 className="font-medium text-gray-900 dark:text-white">Debtors (Owe Money)</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">({debtors.length})</span>
        </div>
        {debtors.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={debtors}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {debtors.map((entry, index) => (
                    <Cell key={`debtor-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No debtors</p>
          </div>
        )}
        <ChartLegend 
          data={debtors} 
          title="Debtors" 
          icon={ArrowDownCircle} 
          color="text-red-600" 
        />
      </div>
    </div>
  )
}

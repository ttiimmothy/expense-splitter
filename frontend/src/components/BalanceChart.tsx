import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Balance {
  userId: string
  userName: string
  netBalance: number
}

interface BalanceChartProps {
  balances: Balance[]
}

const COLORS = ['#3B82F6', '#4a806e', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function BalanceChart({ balances }: BalanceChartProps) {
  // Filter out zero balances and prepare data for the chart
  const chartData = balances
    .filter(balance => Math.abs(balance.netBalance) > 0.01)
    .map((balance, index) => ({
      name: balance.userName,
      value: Math.abs(balance.netBalance),
      balance: balance.netBalance,
      color: COLORS[index % COLORS.length]
    }))

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No balances to display</p>
        <p className="text-sm text-gray-400">All balances are settled</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Balance: <span className={`font-semibold ${data.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.balance > 0 ? '+' : ''}${data.balance.toFixed(2)}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {value} (${entry.payload.balance.toFixed(2)})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

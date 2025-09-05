import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'
import { CheckCircle, ArrowRight, DollarSign } from 'lucide-react'
import {cardTextDarkMode} from "@/constants/colors";

interface SettlementSuggestion {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
}

interface SettlementSuggestionsProps {
  suggestions: SettlementSuggestion[]
  onSettlementCreated: () => void
}

export default function SettlementSuggestions({ suggestions, onSettlementCreated }: SettlementSuggestionsProps) {
  const [settlingIds, setSettlingIds] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const createSettlementMutation = useMutation({
    mutationFn: async (suggestion: SettlementSuggestion) => {
      // Extract groupId from the current URL or pass it as a prop
      const groupId = window.location.pathname.split('/')[2]
      const response = await api.post(`/groups/${groupId}/settlements`, {
        fromUserId: suggestion.fromUserId,
        toUserId: suggestion.toUserId,
        amount: suggestion.amount
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] })
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('Settlement recorded!')
      onSettlementCreated()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record settlement')
    }
  })

  const handleSettle = async (suggestion: SettlementSuggestion) => {
    const settlementKey = `${suggestion.fromUserId}-${suggestion.toUserId}`
    setSettlingIds(prev => new Set(prev).add(settlementKey))
    
    try {
      await createSettlementMutation.mutateAsync(suggestion)
    } finally {
      setSettlingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(settlementKey)
        return newSet
      })
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <p className="text-gray-500">No settlements needed</p>
        <p className="text-sm text-gray-400">Everyone is already settled up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => {
        const settlementKey = `${suggestion.fromUserId}-${suggestion.toUserId}`
        const isSettling = settlingIds.has(settlementKey)
        
        return (
          <div
            key={index}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-red-600">
                    {suggestion.fromUserName.charAt(0)}
                  </span>
                </div>
                <span className="font-medium text-gray-900">{suggestion.fromUserName}</span>
              </div>
              
              <ArrowRight className={`h-4 w-4 text-gray-400 ${cardTextDarkMode}`} />
              
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">
                    {suggestion.toUserName.charAt(0)}
                  </span>
                </div>
                <span className="font-medium text-gray-900">{suggestion.toUserName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  ${suggestion.amount.toFixed(2)}
                </div>
                <div className={`text-xs text-gray-500 ${cardTextDarkMode}`}>Amount to pay</div>
              </div>
              
              <button
                onClick={() => handleSettle(suggestion)}
                disabled={isSettling}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSettling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Settling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Settle
                  </>
                )}
              </button>
            </div>
          </div>
        )
      })}
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">How it works</p>
            <p className="text-sm text-blue-700 mt-1">
              Click "Settle" to record a payment. This will update everyone's balances and 
              help minimize the number of transactions needed to settle all debts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

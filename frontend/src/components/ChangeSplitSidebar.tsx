import { useState, useEffect } from 'react'
import { X, Users, DollarSign, Check, User } from 'lucide-react'
import { cardDarkMode, cardTextDarkMode } from '@/constants/colors'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
}

interface Share {
  id: string
  amountOwed: number
  user: {
    id: string
    name: string
    email: string
  }
}

interface ChangeSplitSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentShares: Share[]
  members: Member[]
  totalAmount: number
  onSplitChange: (splitType: string, newShares: { userId: string; amountOwed: number }[]) => Promise<void>
  isLoading?: boolean
}

export default function ChangeSplitSidebar({
  isOpen,
  onClose,
  currentShares,
  members,
  totalAmount,
  onSplitChange,
  isLoading = false
}: ChangeSplitSidebarProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL')

  // Initialize selected members and amounts from current shares
  useEffect(() => {
    if (currentShares && currentShares.length > 0) {
      const memberIds = new Set(currentShares.map(share => share.user.id))
      setSelectedMembers(memberIds)
      
      const amounts: Record<string, number> = {}
      currentShares.forEach(share => {
        amounts[share.user.id] = share.amountOwed
      })
      setCustomAmounts(amounts)
    }
  }, [currentShares])

  const handleMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
      // Remove custom amount when unselecting
      const newAmounts = { ...customAmounts }
      delete newAmounts[memberId]
      setCustomAmounts(newAmounts)
    } else {
      newSelected.add(memberId)
      // Set equal amount when selecting
      if (splitType === 'EQUAL') {
        const equalAmount = totalAmount / newSelected.size
        setCustomAmounts(prev => ({
          ...prev,
          [memberId]: equalAmount
        }))
      }
    }
    setSelectedMembers(newSelected)
  }

  const handleAmountChange = (memberId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0
    setCustomAmounts(prev => ({
      ...prev,
      [memberId]: numAmount
    }))
  }

  const calculateEqualAmount = () => {
    return selectedMembers.size > 0 ? totalAmount / selectedMembers.size : 0
  }

  const calculateTotalCustom = () => {
    const result = Object.values(customAmounts).reduce((sum, amount) => sum + Number(amount), 0)
    return Math.round(result * 100) / 100 // 2 decimal places
  }

  const handleSave = async () => {
    const newShares = Array.from(selectedMembers).map(userId => ({
      userId,
      amountOwed: splitType === 'EQUAL' ? calculateEqualAmount() : (customAmounts[userId] || 0)
    }))
    
    await onSplitChange(splitType, newShares)
    onClose()
  }

  const handleCancel = () => {
    // Reset to original state
    const memberIds = new Set(currentShares.map(share => share.user.id))
    setSelectedMembers(memberIds)
    
    const amounts: Record<string, number> = {}
    currentShares.forEach(share => {
      amounts[share.user.id] = share.amountOwed
    })
    setCustomAmounts(amounts)
    setSplitType('EQUAL')
    onClose()
  }

  const isAmountValid = () => {
    if (splitType === 'EQUAL') {
      return selectedMembers.size > 0
    } else {
      const total = calculateTotalCustom()
      return Math.abs(total - totalAmount) < 0.01 && selectedMembers.size > 0
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Update Split
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Split Type Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Split Type
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSplitType('EQUAL')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    splitType === 'EQUAL'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Users className="h-5 w-5 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Equal Split</p>
                    <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>
                      Divide equally among selected members
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setSplitType('CUSTOM')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    splitType === 'CUSTOM'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <DollarSign className="h-5 w-5 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Custom Amounts</p>
                    <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>
                      Set individual amounts for each member
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Member Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Select Members ({selectedMembers.size} selected)
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <button
                    key={member.user.id}
                    onClick={() => handleMemberToggle(member.user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedMembers.has(member.user.id)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {member.user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.name}
                      </p>
                      <p className={`text-sm text-gray-500 ${cardTextDarkMode}`}>
                        {member.user.email}
                      </p>
                    </div>
                    {selectedMembers.has(member.user.id) && (
                      <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Details */}
            {selectedMembers.size > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Amount Details
                </h3>
                <div className="space-y-3">
                  {Array.from(selectedMembers).map((memberId) => {
                    const member = members.find(m => m.user.id === memberId)
                    if (!member) return null

                    const amount = splitType === 'EQUAL' 
                      ? calculateEqualAmount() 
                      : (customAmounts[memberId] || 0)

                    return (
                      <div key={memberId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-600">
                            {member.user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                        </div>
                        {splitType === 'CUSTOM' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={totalAmount}
                              value={amount}
                              onChange={(e) => {
                                handleAmountChange(memberId, e.target.value)
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={isLoading}
                            />
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Total Summary */}
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                    <span className={`font-semibold ${
                      Math.abs((splitType === 'EQUAL' ? calculateEqualAmount() * selectedMembers.size : calculateTotalCustom()) - totalAmount) < 0.01
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${splitType === 'EQUAL' ? (calculateEqualAmount() * selectedMembers.size).toFixed(2) : calculateTotalCustom().toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: ${totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !isAmountValid()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

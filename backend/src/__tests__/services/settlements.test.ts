import { SettlementService } from '../../services/settlements'
import { prisma } from '../../db/prisma'

// Mock Prisma
jest.mock('../../db/prisma', () => ({
  prisma: {
    groupMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
    },
    settlement: {
      findMany: jest.fn()
    },
    user: {
      findMany: jest.fn(),
    }
  },
}))

describe('SettlementService', () => {
  let settlementService: SettlementService

  beforeEach(() => {
    settlementService = new SettlementService()
    jest.clearAllMocks()
  })

  describe('getGroupBalances', () => {
    it('should calculate balances correctly for equal split expenses', async () => {
      const mockMembers = [
        { user: { id: 'user1', name: 'Alice' } },
        { user: { id: 'user2', name: 'Bob' } },
        { user: { id: 'user3', name: 'Charlie' } },
      ]

      const mockExpenses = [
        {
          amount: 300,
          payers: [
            { user: { id: 'user1' }, amount: 300 },
          ],
          shares: [
            { user: { id: 'user1' }, amountOwed: 100 },
            { user: { id: 'user2' }, amountOwed: 100 },
            { user: { id: 'user3' }, amountOwed: 100 },
          ],
        },
        {
          amount: 150,
          payers: [
            { user: { id: 'user2' }, amount: 150 },
          ],
          shares: [
            { user: { id: 'user1' }, amountOwed: 50 },
            { user: { id: 'user2' }, amountOwed: 50 },
            { user: { id: 'user3' }, amountOwed: 50 },
          ],
        },
      ]

      ;(prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({})
      ;(prisma.groupMember.findMany as jest.Mock).mockResolvedValue(mockMembers)
      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockMembers.map(m => m.user))

      const balances = await settlementService.getGroupBalances('group1', 'user1')

      expect(balances).toHaveLength(3)
      expect(balances.find(b => b.userId === 'user1')?.netBalance).toBe(150) // Paid 300, owes 150
      // expect(balances.find(b => b.userId === 'user1')?.isCurrentMember).toBe(true)
      expect(balances.find(b => b.userId === 'user2')?.netBalance).toBe(0)  // Paid 150, owes 150
      // expect(balances.find(b => b.userId === 'user2')?.isCurrentMember).toBe(true)
      expect(balances.find(b => b.userId === 'user3')?.netBalance).toBe(-150) // Paid 0, owes 150
      // expect(balances.find(b => b.userId === 'user3')?.isCurrentMember).toBe(true)
    })

    it('should calculate balances correctly with multiple payers', async () => {
      const mockMembers = [
        { user: { id: 'user1', name: 'Alice' } },
        { user: { id: 'user2', name: 'Bob' } },
        { user: { id: 'user3', name: 'Charlie' } },
      ]

      const mockExpenses = [
        {
          amount: 300,
          payers: [
            { user: { id: 'user1' }, amount: 200 },
            { user: { id: 'user2' }, amount: 100 },
          ],
          shares: [
            { user: { id: 'user1' }, amountOwed: 100 },
            { user: { id: 'user2' }, amountOwed: 100 },
            { user: { id: 'user3' }, amountOwed: 100 },
          ],
        },
      ]

      ;(prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({})
      ;(prisma.groupMember.findMany as jest.Mock).mockResolvedValue(mockMembers)
      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockMembers.map(m => m.user))

      const balances = await settlementService.getGroupBalances('group1', 'user1')

      expect(balances).toHaveLength(3)
      expect(balances.find(b => b.userId === 'user1')?.netBalance).toBe(100) // Paid 200, owes 100
      // expect(balances.find(b => b.userId === 'user1')?.isCurrentMember).toBe(true)
      expect(balances.find(b => b.userId === 'user2')?.netBalance).toBe(0)   // Paid 100, owes 100
      // expect(balances.find(b => b.userId === 'user2')?.isCurrentMember).toBe(true)
      expect(balances.find(b => b.userId === 'user3')?.netBalance).toBe(-100) // Paid 0, owes 100
      // expect(balances.find(b => b.userId === 'user3')?.isCurrentMember).toBe(true)
    })

    it('should include users who left the group but have outstanding balances', async () => {
      const mockMembers = [
        { user: { id: 'user1', name: 'Alice' } },
        { user: { id: 'user2', name: 'Bob' } },
        // user3 is not in current members (left the group)
      ]

      const mockExpenses = [
        {
          amount: 300,
          payers: [
            { user: { id: 'user1' }, amount: 300 },
          ],
          shares: [
            { user: { id: 'user1' }, amountOwed: 100 },
            { user: { id: 'user2' }, amountOwed: 100 },
            { user: { id: 'user3' }, amountOwed: 100 }, // user3 owes money but left group
          ],
        },
      ]

      // Mock the additional query for all involved users
      const mockAllInvolvedUsers = [
        { id: 'user1', name: 'Alice' },
        { id: 'user2', name: 'Bob' },
        { id: 'user3', name: 'Charlie' }, // This user left but still has balance
      ]

      ;(prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({})
      ;(prisma.groupMember.findMany as jest.Mock).mockResolvedValue(mockMembers)
      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockAllInvolvedUsers)

      const balances = await settlementService.getGroupBalances('group1', 'user1')

      expect(balances).toHaveLength(3)
      expect(balances.find(b => b.userId === 'user1')?.netBalance).toBe(200) // Paid 300, owes 100
      // expect(balances.find(b => b.userId === 'user1')?.isCurrentMember).toBe(true)
      expect(balances.find(b => b.userId === 'user2')?.netBalance).toBe(-100) // Paid 0, owes 100
      // expect(balances.find(b => b.userId === 'user2')?.isCurrentMember).toBe(true)
      expect(balances.find(b => b.userId === 'user3')?.netBalance).toBe(-100) // Paid 0, owes 100
      // expect(balances.find(b => b.userId === 'user3')?.isCurrentMember).toBe(false) // Left the group
    })
  })

  describe('getSettlementSuggestions', () => {
    it('should suggest minimal number of transactions', async () => {
      const mockBalances = [
        { userId: 'user1', userName: 'Alice', netBalance: 100, isCurrentMember: true },
        { userId: 'user2', userName: 'Bob', netBalance: -50, isCurrentMember: true },
        { userId: 'user3', userName: 'Charlie', netBalance: -50, isCurrentMember: true },
      ]

      // Mock the getGroupBalances method
      jest.spyOn(settlementService, 'getGroupBalances').mockResolvedValue(mockBalances)

      const suggestions = await settlementService.getSettlementSuggestions('group1', 'user1')

      expect(suggestions).toHaveLength(2)
      expect(suggestions[0]).toMatchObject({
        fromUserId: 'user2',
        toUserId: 'user1',
        amount: 50,
      })
      expect(suggestions[1]).toMatchObject({
        fromUserId: 'user3',
        toUserId: 'user1',
        amount: 50,
      })
    })
  })
})

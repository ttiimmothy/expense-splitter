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
          payer: { id: 'user1' },
          amount: 300,
          shares: [
            { user: { id: 'user1' }, amountOwed: 100 },
            { user: { id: 'user2' }, amountOwed: 100 },
            { user: { id: 'user3' }, amountOwed: 100 },
          ],
        },
        {
          payer: { id: 'user2' },
          amount: 150,
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

      const balances = await settlementService.getGroupBalances('group1', 'user1')

      expect(balances).toHaveLength(3)
      expect(balances.find(b => b.userId === 'user1')?.netBalance).toBe(150) // Paid 300, owes 150
      expect(balances.find(b => b.userId === 'user2')?.netBalance).toBe(0) // Paid 150, owes 150
      expect(balances.find(b => b.userId === 'user3')?.netBalance).toBe(-150) // Paid 0, owes 150
    })
  })

  describe('getSettlementSuggestions', () => {
    it('should suggest minimal number of transactions', async () => {
      const mockBalances = [
        { userId: 'user1', userName: 'Alice', netBalance: 100 },
        { userId: 'user2', userName: 'Bob', netBalance: -50 },
        { userId: 'user3', userName: 'Charlie', netBalance: -50 },
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

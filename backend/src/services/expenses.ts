import { prisma } from '../db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateExpenseData {
  groupId: string;
  description: string;
  amount: number;
  split: 'EQUAL' | 'CUSTOM';
  shares?: Array<{
    userId: string;
    amountOwed: number;
  }>;
}

export class ExpenseService {
  async createExpense(data: CreateExpenseData) {
    const { groupId, description, amount, split, shares } = data;

    // Get group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (groupMembers.length === 0) {
      throw new Error('Group has no members');
    }

    // Calculate shares
    let expenseShares: Array<{ userId: string; amountOwed: number }> = [];

    if (split === 'EQUAL') {
      const amountPerPerson = amount / groupMembers.length;
      expenseShares = groupMembers.map(member => ({
        userId: member.user.id,
        amountOwed: amountPerPerson
      }));
    } else if (split === 'CUSTOM' && shares) {
      expenseShares = shares;
    } else {
      throw new Error('Custom split requires shares data');
    }

    // Create expense with shares
    const expense = await prisma.expense.create({
      data: {
        groupId,
        description,
        amount: new Decimal(amount),
        split,
        shares: {
          create: expenseShares.map(share => ({
            userId: share.userId,
            amountOwed: new Decimal(share.amountOwed)
          }))
        }
      },
      include: {
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return expense;
  }

  async getGroupExpenses(groupId: string, userId: string) {
    // Verify user is member of group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    return prisma.expense.findMany({
      where: { groupId },
      include: {
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

import { prisma } from '../db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateExpenseData {
  groupId: string;
  description: string;
  amount: number;
  split: 'EQUAL' | 'CUSTOM';
  payers: Array<{
    userId: string;
    amount: number;
  }>;
  shares?: Array<{
    userId: string;
    amountOwed: number;
  }>;
}

export class ExpenseService {
  async createExpense(data: CreateExpenseData) {
    const { groupId, description, amount, split, payers, shares } = data;

    // Validate payers amount matches total amount
    const totalPaid = payers.reduce((sum, payer) => sum + payer.amount, 0);
    if (Math.abs(totalPaid - amount) > 0.01) {
      throw new Error('Total amount paid by payers must equal expense amount');
    }

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

    // Create expense with payers and shares
    const expense = await prisma.expense.create({
      data: {
        groupId,
        description,
        amount: new Decimal(amount),
        split,
        payers: {
          create: payers.map(payer => ({
            userId: payer.userId,
            amount: new Decimal(payer.amount)
          }))
        },
        shares: {
          create: expenseShares.map(share => ({
            userId: share.userId,
            amountOwed: new Decimal(share.amountOwed)
          }))
        }
      },
      include: {
        payers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
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
}
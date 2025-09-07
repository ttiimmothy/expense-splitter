import {Expense, ExpenseShare, Prisma, User} from "@prisma/client";
import { prisma } from '../db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface Balance {
  userId: string;
  userName: string;
  netBalance: number;
}

export interface SettlementSuggestion {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

type ExpenseWithSharesAndUser =  Prisma.ExpenseGetPayload<{
  include: {
    shares: { include: { user: true } }
  }
}>

export class SettlementService {
  async getGroupBalances(groupId: string, userId: string): Promise<Balance[]> {
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

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      orderBy: {
        user: {name: "asc"}
        
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get all expenses for the group
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        shares: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Calculate net balances
    const balances: Map<string, { name: string; balance: number }> = new Map();

    // Initialize all members with 0 balance
    members.forEach(member => {
      balances.set(member.user.id, {
        name: member.user.name,
        balance: 0
      });
    });

    // Calculate balances from expenses
    expenses.forEach((expense: ExpenseWithSharesAndUser) => {
      // Each share holder gets debited for what they pay
      // .div still stay Decimal, need toNumber() for calculation
      const average = Math.round(Number(expense.amount) / expense.shares.length * 100) / 100
      expense.shares.forEach(share => {
        const shareBalance = balances.get(share.user.id);
        if (shareBalance) {
          shareBalance.balance += Math.round(Number(share.amountPaid) * 100) / 100 - average;
        }
      });
    });

    // Apply recorded settlements (reduce creditors, reduce debtors' debts)
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      select: { fromUserId: true, toUserId: true, amount: true }
    });

    if (settlements && settlements.length > 0) {
      for (const s of settlements) {
        const fromB = balances.get(s.fromUserId);
        const toB = balances.get(s.toUserId);
        const amt = Number(s.amount);

        // From user paid, so their negative balance increases toward zero
        if (fromB) fromB.balance += amt;
        // To user received, so their positive balance decreases toward zero
        if (toB) toB.balance -= amt;
      }
    }

    // Convert to array format
    return Array.from(balances.entries()).map(([userId, data]) => ({
      userId,
      userName: data.name,
      netBalance: Math.round(data.balance * 100) / 100
    }));
  }

  async getSettlementSuggestions(groupId: string, userId: string): Promise<SettlementSuggestion[]> {
    const balances = await this.getGroupBalances(groupId, userId);
    
    // Separate creditors and debtors
    const creditors = balances.filter(b => b.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);
    const debtors = balances.filter(b => b.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);

    const suggestions: SettlementSuggestion[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    // Greedy algorithm to minimize number of transactions
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const settlementAmount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));

      if (settlementAmount > 0.01) { // Only suggest settlements > 1 cent
        suggestions.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.userName,
          toUserId: creditor.userId,
          toUserName: creditor.userName,
          amount: settlementAmount
        });

        creditor.netBalance -= settlementAmount;
        debtor.netBalance += settlementAmount;

        if (Math.abs(creditor.netBalance) < 0.01) {
          creditorIndex++;
        }
        if (Math.abs(debtor.netBalance) < 0.01) {
          debtorIndex++;
        }
      } else {
        creditorIndex++;
        debtorIndex++;
      }
    }

    return suggestions;
  }

  async createSettlement(groupId: string, fromUserId: string, toUserId: string, amount: number, creatorId: string) {
    // Verify creator is member of group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: creatorId,
          groupId
        }
      }
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    const settlement = prisma.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount: new Decimal(amount)
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return settlement
  }

  async getGroupSettlements(groupId: string, userId: string) {
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

    const settlements = prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return settlements
  }
}

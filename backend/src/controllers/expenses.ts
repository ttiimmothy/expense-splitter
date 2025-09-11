import { Request, Response } from 'express';
import { z } from 'zod';
import { ExpenseService } from '../services/expenses';
import {prisma} from "../db/prisma";
import {Decimal} from "@prisma/client/runtime/library";
import {io} from "..";

const expenseService = new ExpenseService();

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  split: z.enum(['EQUAL', 'CUSTOM']),
  payers: z.array(z.object({
    userId: z.string(),
    amount: z.number().positive()
  })),
  shares: z.array(z.object({
    userId: z.string(),
    amountOwed: z.number()
  })).optional()
});

export const createExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const parsedBody = {
      ...req.body, 
      amount: parseFloat(req.body.amount),
      payers: req.body.payers.map((payer) => ({...payer, amount: parseFloat(payer.amount)})),
      shares: req.body.shares?.map((share) => ({...share, amountOwed: parseFloat(share.amountOwed)}))
    }
    const data = createExpenseSchema.parse(parsedBody);
    
    const expense = await expenseService.createExpense({
      ...data,
      groupId,
    });

    io.to(`group-${groupId}`).emit("expense-created")
    
    res.status(201).json({ expense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error
      });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Group has no members') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Custom split requires shares data') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Total amount paid by payers must equal expense amount') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupExpenses = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { groupId },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ expenses });
  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExpense = async (req: Request, res: Response) => {
  try {
    const {expenseId} = req.params
    const expense = await prisma.expense.findUnique({
      where: {id: expenseId},
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
    })
    res.json(expense)
  } catch (e) {
    if (e instanceof Error && e.message === 'Access denied') {
      return res.status(403).json({ error: e.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const updateExpenseShare = async (req: Request, res: Response) => {
  try {
    const {groupId, expenseId} = req.params
    const {split, shares} = req.body
    await prisma.expense.update({
      where: {id: expenseId},
      data: {
        split,
        shares: {
          update: shares.map((share) => ({
            where: {expenseId_userId: {expenseId, userId: share.userId}},
            data: {amountOwed: new Decimal(share.amountOwed)}
          }))
        }
      }
    })
    io.to(`group-${groupId}`).emit("expense-updated")

    res.json({message: "Expense split and shares update success"})
  } catch (e) {
    if (e instanceof Error && e.message === 'Access denied') {
      return res.status(403).json({ error: e.message });
    }
    console.error(e)
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const {groupId, expenseId} = req.params
    await prisma.expense.delete({
      where: {id: expenseId}
    })
    
    io.to(`group-${groupId}`).emit("expense-updated")

    res.json({message: "expense delete success"})
  } catch (e) {
    if (e instanceof Error && e.message === 'Access denied') {
      return res.status(403).json({ error: e.message });
    }
    console.error(e)
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const editExpense = async (req: Request, res: Response) => {
  try {
    const {groupId, expenseId} = req.params
    const {description, amount, split, payers, shares} = req.body
    
    // Validate payers amount matches total amount
    if (payers) {
      const totalPaid = payers.reduce((sum, payer) => sum + parseFloat(payer.amount), 0);
      if (Math.abs(totalPaid - parseFloat(amount)) > 0.01) {
        return res.status(400).json({ error: 'Total amount paid by payers must equal expense amount' });
      }
    }

    await prisma.expense.update({
      where: {id: expenseId},
      data: {
        description,
        amount: new Decimal(amount),
        split,
        payers: payers ? {
          deleteMany: {}, // Remove all existing payers
          create: payers.map((payer) => ({
            userId: payer.userId,
            amount: new Decimal(parseFloat(payer.amount))
          }))
        } : undefined,
        shares: shares ? {
          deleteMany: {}, // Remove all existing shares
          create: shares.map((share) => ({
            userId: share.userId,
            amountOwed: new Decimal(parseFloat(share.amountOwed))
          }))
        } : undefined
      }
    })
    
    io.to(`group-${groupId}`).emit("expense-updated")

    res.json({message: "Expense update success"})
  } catch (e) {
    if (e instanceof Error && e.message === 'Access denied') {
      return res.status(403).json({ error: e.message });
    }
    console.error(e)
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
import { Request, Response } from 'express';
import { z } from 'zod';
import { ExpenseService } from '../services/expenses';
import {prisma} from "@/db/prisma";
import {ExpenseShare} from "@prisma/client";
import {Decimal} from "@prisma/client/runtime/library";
import {io} from "..";

const expenseService = new ExpenseService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  split: z.enum(['EQUAL', 'CUSTOM']),
  shares: z.array(z.object({
    userId: z.string(),
    amountPaid: z.number().positive()
  })).optional()
});

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id: groupId } = req.params;

    const parsedBody = {...req.body, amount: parseFloat(req.body.amount), shares: req.body.shares.map((share) => ({...share, amountPaid: parseFloat(share.amountPaid)}))}

    const data = createExpenseSchema.parse(parsedBody);
    
    const expense = await expenseService.createExpense({
      ...data,
      groupId,
    });
    io.to(groupId).emit("expense-created")
    
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
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupExpenses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id: groupId } = req.params;
    const expenses = await expenseService.getGroupExpenses(groupId, req.user.id);
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
    await prisma.expense.update({
      where: {id: expenseId},
      data: {
        split: req.body.splitType,
        shares: {
          update: req.body.shares.map((share) => ({
            where: {expenseId_userId: {expenseId, userId: share.userId}},
            data: {amountPaid: new Decimal(share.amountPaid)}
          }))
        }
      }
    })
    io.to(groupId).emit("expense-updated")

    res.json({message: "Expense split and shares update success"})
  } catch (e) {
    if (e instanceof Error && e.message === 'Access denied') {
      return res.status(403).json({ error: e.message });
    }
    console.error(e)
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
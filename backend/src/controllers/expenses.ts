import { Request, Response } from 'express';
import { z } from 'zod';
import { ExpenseService } from '../services/expenses';

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
    amountOwed: z.number().positive()
  })).optional()
});

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id: groupId } = req.params;
    const parsedBody = {...req.body, amount: parseFloat(req.body.amount), shares: req.body.shares.map((share) => ({...share, amountOwed: parseFloat(share.amountOwed)}))}
    const data = createExpenseSchema.parse(parsedBody);
    
    const expense = await expenseService.createExpense({
      ...data,
      groupId,
      payerId: req.user.id
    });
    
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

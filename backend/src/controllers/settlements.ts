import { Request, Response } from 'express';
import { z } from 'zod';
import { SettlementService } from '../services/settlements';
import {io} from "..";
import {prisma} from "@/db/prisma";

const settlementService = new SettlementService();

const createSettlementSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.number().positive()
});

export const getGroupBalances = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const balances = await settlementService.getGroupBalances(groupId, req.user.id);
    const suggestions = await settlementService.getSettlementSuggestions(groupId, req.user.id);
    
    res.json({ 
      balances,
      suggestions
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSettlement = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const data = createSettlementSchema.parse(req.body);
    
    const settlement = await settlementService.createSettlement(
      groupId,
      data.fromUserId,
      data.toUserId,
      data.amount,
      req.user.id
    );

    io.to(`$group-${groupId}`).emit("settlement-created")
    
    res.status(201).json({ settlement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error
      });
    }
    
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupSettlements = async (req:Request, res:Response) => {
  const {groupId} = req.params

  const settlements = await prisma.settlement.findMany({
    where: {groupId},
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
    orderBy: {createdAt: "desc"}
  })

  res.json(settlements)
}
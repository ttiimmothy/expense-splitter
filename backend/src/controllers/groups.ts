import { Request, Response } from 'express';
import { z } from 'zod';
import { GroupService } from '../services/groups';
import {prisma} from "@/db/prisma";

const groupService = new GroupService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const createGroupSchema = z.object({
  name: z.string().min(1),
  currency: z.string().optional()
});

const inviteMemberSchema = z.object({
  userEmail: z.email()
});

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = createGroupSchema.parse(req.body);
    
    const group = await groupService.createGroup({
      ...data,
      userId: req.user.id
    });
    
    res.status(201).json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserGroups = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const groups = await groupService.getUserGroups(req.user.id);
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const group = await groupService.getGroupById(id, req.user.id);
    
    res.json({ group });
  } catch (error) {
    if (error instanceof Error && error.message === 'Group not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id: groupId } = req.params;
    const data = inviteMemberSchema.parse(req.body);
    
    const member = await groupService.inviteMember({
      groupId,
      userEmail: data.userEmail,
      inviterId: req.user.id
    });
    
    res.status(201).json({ member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error
      });
    }
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'User is already a member of this group') {
        return res.status(409).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const findAvailableUsersEmail = async (req: Request, res: Response) => {
  try {
    const {groupId} = req.params
    const {search} = req.query

    const group = await prisma.group.findUnique({
      where: {id: groupId},
      include: {
        members: true
      }
    })
    const users = await prisma.user.findMany({
      where:{
        id: {
          notIn: group.members.map(m => m.userId)
        },
        email: {
          contains: search as string,
          mode: 'insensitive'
        }
      },
      select: {
        id: true, 
        name: true, 
        email: true, 
        avatarUrl: true
      },
      orderBy: {
        email: "asc"
      }
    })
    res.json(users)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: e
      });
    }
    
    if (e instanceof Error) {
      if (e.message === 'User not found') {
        return res.status(404).json({ error: e.message });
      }
      if (e.message === 'User is already a member of this group') {
        return res.status(409).json({ error: e.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

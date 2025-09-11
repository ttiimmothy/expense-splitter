import { Request, Response } from 'express';
import { z } from 'zod';
import { GroupService } from '../services/groups';
import {prisma} from "../db/prisma";
import {io} from "..";

const groupService = new GroupService();

const createGroupSchema = z.object({
  name: z.string().min(1),
  currency: z.string().optional()
});

const inviteMembersSchema = z.object({
  userEmails: z.array(z.email()).min(1).max(10)
});

export const createGroup = async (req: Request, res: Response) => {
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

export const getUserGroups = async (req: Request, res: Response) => {
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

export const getGroupById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const group = await groupService.getGroupById(groupId, req.user.id);
    
    res.json({ group });
  } catch (error) {
    if (error instanceof Error && error.message === 'Group not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const inviteMultipleMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const data = inviteMembersSchema.parse(req.body);
    
    const invitedMembers = await Promise.all(
      data.userEmails.map(async (email) => 
        await groupService.inviteMember({
          groupId,
          userEmail: email,
          inviterId: req.user.id
        })
      )
    );
    
    io.emit("group-updated")
    
    res.status(201).json({ members: invitedMembers, invitedCount: invitedMembers.length });
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
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const deleteGroupMember = async (req: Request, res: Response) => {
  try {
    const {memberId} = req.params

    const member = await prisma.groupMember.findUnique({
      where: {
        id: memberId
      }
    })

    if (!member) {
      res.status(404).json({error: "member doesn't exist"})
      return
    }

    await prisma.groupMember.delete({
      where: {
        id: memberId
      }
    })

    res.json({message: "group member delete success"})
  } catch (e) {    
    if (e instanceof Error) {
      if (e.message === 'User not found') {
        return res.status(404).json({ error: e.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const getGroupExpenses = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const expenses = await groupService.getGroupExpenses(groupId, req.user.id);
    res.json({ expenses });
  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changeGroupOwner = async (req: Request, res: Response) => {
  try {
    const {groupId, memberId} = req.params
    const originalOwnerId = req.user.id
    
    await prisma.$transaction(async (tx) => {
      // Update the new member to OWNER
      await tx.groupMember.update({
        where: { id: memberId },
        data: {
          role: "OWNER"
        }
      });
  
      // Update the original owner to MEMBER
      await tx.groupMember.update({
        where: { userId_groupId: { userId: originalOwnerId, groupId } },
        data: {
          role: "MEMBER"
        }
      });
  
       // Check current number of owners in the group
       const ownerCount = await tx.groupMember.count({
        where: {
          groupId,
          role: "OWNER"
        }
      });
  
      // If there's more than 1 owner, don't proceed
      if (ownerCount > 1) {
        throw new Error('Too many owners');
      }
    });
  
    res.json({message: "group owner change success"})
  } catch (e) {
    if (e instanceof Error && e.message === "Too many owners") {
      return res.status(400).json({ error: e.message });
    }
    
    console.error('Change group owner error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
 
}

export const deleteGroup = async (req: Request, res: Response) => {
  const {groupId} = req.params

  await prisma.group.delete({
    where: {id: groupId}
  })

  res.json({message: "group delete success"})
}
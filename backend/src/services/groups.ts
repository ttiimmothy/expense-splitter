import { prisma } from '../db/prisma';

export interface CreateGroupData {
  name: string;
  currency?: string;
  userId: string;
}

export interface InviteMemberData {
  groupId: string;
  userEmail: string;
  inviterId: string;
}

export class GroupService {
  async createGroup(data: CreateGroupData) {
    return prisma.group.create({
      data: {
        name: data.name,
        currency: data.currency || 'USD',
        members: {
          create: {
            userId: data.userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
  }

  async getUserGroups(userId: string) {
    return prisma.group.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            user: {
              name: "asc"
            }
          }
        },
        _count: {
          select: {
            expenses: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: {
          orderBy: {
            user: {name: "asc"}
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              },
             
            }
          }
        }
      }
    });

    if (!group) {
      throw new Error('Group not found or access denied');
    }

    return group;
  }

  async inviteMember(data: InviteMemberData) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.userEmail }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: data.groupId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    // Add user to group
    return prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: data.groupId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
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


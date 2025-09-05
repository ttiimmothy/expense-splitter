import { prisma } from '../db/prisma';
import bcrypt, {compare} from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class UserService {
  async createUser(data: CreateUserData) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        provider: 'email'
      }
    });
    
    return user;
  }

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.password) {
      const match = await compare(data.password, user.password)
      if (!match) {
        throw new Error("Incorrect password")
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  }
}

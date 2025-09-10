import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/users';

const userService = new UserService();

const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(2)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const user = await userService.createUser(data);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error
      });
    }
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({
        error: 'Email already exists'
      });
    }
    console.error(error)
    
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const result = await userService.login(data);
    
    // Set HTTP-only cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      secure: true,
      // sameSite: 'lax',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error
      });
      return
    }
    
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({
        error: 'Invalid credentials'
      });
      return
    }
    
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.json({ message: 'Logged out successfully' });
};

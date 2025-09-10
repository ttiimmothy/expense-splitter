import { z } from 'zod'

// Registration form schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(100, 'Email must be less than 100 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(2, 'Password must be at least 2 characters')
    .max(100, 'Password must be less than 100 characters')
    // .regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    //   'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    // ),
})

// Login form schema
export const loginSchema = z.object({
  email: z
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

// Type exports
export type RegisterForm = z.infer<typeof registerSchema>
export type LoginForm = z.infer<typeof loginSchema>

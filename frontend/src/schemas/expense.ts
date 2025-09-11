import { z } from 'zod'

// Share schema for expense splits
export const shareSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amountOwed: z.number().min(0, 'Amount must be positive'),
})

// Payer schema for who paid and how much
export const payerSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
})

// Base expense form schema
export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be less than 200 characters'),
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount must be less than 1,000,000'),
  split: z.enum(['EQUAL', 'CUSTOM']),
  shares: z.array(shareSchema).min(1, 'At least one member must be selected'),
  payers: z.array(payerSchema).min(1, 'At least one payer is required'),
})

// More flexible schema for AddExpenseModal (shares can be empty initially)
export const createExpenseSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be less than 200 characters'),
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount must be less than 1,000,000'),
  split: z.enum(['EQUAL', 'CUSTOM']),
  shares: z.array(shareSchema), // No minimum requirement for creation
  payers: z.array(payerSchema), // No minimum requirement for creation
})

// Type exports
export type ExpenseForm = z.infer<typeof expenseSchema>
export type CreateExpenseForm = z.infer<typeof createExpenseSchema>
export type ShareForm = z.infer<typeof shareSchema>
export type PayerForm = z.infer<typeof payerSchema>

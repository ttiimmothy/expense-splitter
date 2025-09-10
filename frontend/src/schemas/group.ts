import { z } from 'zod'

// Group creation schema
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Group name can only contain letters, numbers, spaces, hyphens, and underscores'),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .length(3, 'Currency must be a 3-letter code (e.g., USD, EUR)')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase (e.g., USD, EUR)'),
})

// Invite member schema
export const inviteMemberSchema = z.object({
  userEmail: z
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(100, 'Email must be less than 100 characters'),
})

// Type exports
export type CreateGroupForm = z.infer<typeof createGroupSchema>
export type InviteMemberForm = z.infer<typeof inviteMemberSchema>

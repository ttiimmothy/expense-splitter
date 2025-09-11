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

// Invite multiple members schema
export const inviteMultipleMembersSchema = z.object({
  userEmails: z
    .array(z.email('Invalid email address'))
    .min(1, 'At least one email is required')
    .max(10, 'Cannot invite more than 10 members at once')
    .refine(
      (emails) => emails.length === new Set(emails).size,
      'Duplicate emails are not allowed'
    ),
})

// Edit group schema
export const editGroupSchema = z.object({
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

// Type exports
export type CreateGroupForm = z.infer<typeof createGroupSchema>
export type InviteMemberForm = z.infer<typeof inviteMemberSchema>
export type InviteMultipleMembersForm = z.infer<typeof inviteMultipleMembersSchema>
export type EditGroupForm = z.infer<typeof editGroupSchema>

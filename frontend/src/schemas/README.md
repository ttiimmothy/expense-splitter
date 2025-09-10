# Zod Schemas for React Hook Form

This directory contains Zod schemas for form validation across the application.

## Available Schemas

### Auth Schemas (`auth.ts`)
- **`registerSchema`**: User registration form validation
  - Name: 2-50 characters, letters and spaces only
  - Email: Valid email format, max 100 characters
  - Password: 6+ characters, must contain uppercase, lowercase, and number
- **`loginSchema`**: User login form validation
  - Email: Valid email format
  - Password: Required

### Expense Schemas (`expense.ts`)
- **`expenseSchema`**: Full expense validation (for API)
  - Description: 3-200 characters
  - Amount: 0.01 - 999,999.99
  - Split: EQUAL or CUSTOM
  - Shares: Array with at least 1 member
- **`createExpenseSchema`**: Flexible expense validation (for forms)
  - Same as expenseSchema but shares can be empty initially
- **`shareSchema`**: Individual share validation
  - UserId: Required string
  - AmountPaid: Positive number

### Group Schemas (`group.ts`)
- **`createGroupSchema`**: Group creation validation
  - Name: 2-50 characters, alphanumeric with spaces, hyphens, underscores
  - Currency: 3-letter uppercase code (e.g., USD, EUR)
- **`inviteMemberSchema`**: Member invitation validation
  - UserEmail: Valid email format, max 100 characters

## Usage Examples

### Basic Form Setup
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterForm } from '../schemas/auth'

const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
  resolver: zodResolver(registerSchema),
  mode: 'onBlur',
})
```

### Form Input
```typescript
<input
  {...register('email')}
  type="email"
  className="input"
  placeholder="Enter your email"
/>
{errors.email && (
  <p className="text-red-600">{errors.email.message}</p>
)}
```

## Benefits

1. **Type Safety**: Automatic TypeScript types from schemas
2. **Validation**: Comprehensive validation with custom error messages
3. **Reusability**: Schemas can be shared between frontend and backend
4. **Performance**: Validation only runs when needed
5. **Developer Experience**: Better autocomplete and error detection
6. **Maintainability**: Centralized validation logic

## Form Components Using Zod

- ✅ `RegisterPage.tsx` - Uses `registerSchema`
- ✅ `LoginPage.tsx` - Uses `loginSchema`
- ✅ `CreateExpenseModal.tsx` - Uses `createExpenseSchema`
- ✅ `EditExpenseSidebar.tsx` - Uses `createExpenseSchema`

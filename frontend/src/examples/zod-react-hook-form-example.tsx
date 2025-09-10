/**
 * Example: Using Zod with React Hook Form
 * 
 * This file demonstrates how to use Zod schemas with React Hook Form
 * for type-safe form validation.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 1. Define your Zod schema
const exampleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  age: z
    .number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Must be less than 120 years old'),
  website: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')), // Allow empty string
})

// 2. Infer the TypeScript type from the schema
type ExampleForm = z.infer<typeof exampleSchema>

// 3. Use in your component
export function ExampleFormComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExampleForm>({
    resolver: zodResolver(exampleSchema),
    mode: 'onBlur', // Validate on blur for better UX
    defaultValues: {
      name: '',
      email: '',
      age: 18,
      website: '',
    },
  })

  const onSubmit = async (data: ExampleForm) => {
    try {
      // Your form submission logic here
      console.log('Form data:', data)
      
      // Reset form after successful submission
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          className="input mt-1"
          placeholder="Enter your name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="input mt-1"
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Age field */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
          Age
        </label>
        <input
          {...register('age', { valueAsNumber: true })}
          type="number"
          className="input mt-1"
          placeholder="Enter your age"
        />
        {errors.age && (
          <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
        )}
      </div>

      {/* Website field (optional) */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website (optional)
        </label>
        <input
          {...register('website')}
          type="url"
          className="input mt-1"
          placeholder="https://example.com"
        />
        {errors.website && (
          <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}

/**
 * Key Benefits of Using Zod with React Hook Form:
 * 
 * 1. Type Safety: Automatic TypeScript types from schemas
 * 2. Validation: Comprehensive validation rules
 * 3. Error Messages: Custom, user-friendly error messages
 * 4. Reusability: Schemas can be shared between frontend and backend
 * 5. Performance: Validation only runs when needed
 * 6. Developer Experience: Better autocomplete and error detection
 * 
 * Common Zod Methods:
 * - z.string() - String validation
 * - z.number() - Number validation
 * - z.boolean() - Boolean validation
 * - z.array() - Array validation
 * - z.object() - Object validation
 * - z.enum() - Enum validation
 * - z.optional() - Optional fields
 * - z.nullable() - Nullable fields
 * - z.refine() - Custom validation logic
 * - z.transform() - Transform data
 * 
 * Common Validation Rules:
 * - .min() - Minimum length/value
 * - .max() - Maximum length/value
 * - .email() - Email format validation
 * - .url() - URL format validation
 * - .regex() - Custom regex validation
 * - .refine() - Custom validation function
 */

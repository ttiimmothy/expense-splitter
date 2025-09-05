import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import {bgDarkMode, textDarkMode} from "@/constants/colors";

interface RegisterForm {
  name: string
  email: string
  password: string
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>()

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data.name, data.email, data.password)
      toast.success('Account created!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className={`${bgDarkMode} flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <UserPlus className="h-6 w-6 text-primary-600" />
          </div>

          <h2 className={`mt-6 text-center text-3xl font-extrabold text-gray-900 ${textDarkMode}`}>
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Expense Splitter in seconds
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium text-gray-700 ${textDarkMode}`}>
                Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="input mt-1"
                placeholder="Your name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium text-gray-700 ${textDarkMode}`}>
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="input mt-1"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium text-gray-700 ${textDarkMode}`}>
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center py-3"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}




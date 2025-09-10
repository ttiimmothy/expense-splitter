import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import {bgDarkMode, cardDarkMode, textDarkMode} from "@/constants/colors";
import {useQueryClient} from "@tanstack/react-query";
import { loginSchema, type LoginForm } from '../schemas/auth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })
  const queryClient = useQueryClient()

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className={`${bgDarkMode} flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <LogIn className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold text-gray-900 ${textDarkMode}`}>
            Sign in to Expense Splitter
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Split expenses with friends and family
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium text-gray-700 ${textDarkMode}`}>
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                className={`input ${cardDarkMode} mt-1`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className={`block text-sm font-medium text-gray-700 ${textDarkMode}`}>
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${cardDarkMode} pr-10`}
                  placeholder="Enter your password"
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* <div className="text-center">
            <p className="text-sm text-gray-600">
              Demo credentials: alice@example.com (or bob@example.com, charlie@example.com)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Password: any password (authentication is simplified for demo)
            </p>
          </div> */}
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

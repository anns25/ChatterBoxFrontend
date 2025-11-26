'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { themeClasses } from '@/utils/theme'
import { getApiUrl } from '@/utils/config'

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Validation functions
  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Valid email is required'
    }
    return undefined
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return 'Password is required'
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      const response = await axios.post(getApiUrl('api/auth/login'), {
        email: email.trim().toLowerCase(),
        password,
      })

      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      // Redirect to home or chat page
      window.location.href = '/user'
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || 'Login failed'
        setError(errorMessage)
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center ${themeClasses.bgPrimary}`}>
      <div className={`w-full max-w-sm p-8 rounded-lg ${themeClasses.bgSecondary} ${themeClasses.borderPrimary} border shadow-lg`}>
        <div className="text-center mb-8">
          {/* Logo or Icon */}
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg ${themeClasses.bgAccent}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3h5.25m4.5 3.75V6.75A2.25 2.25 0 0014.25 4.5H5.25A2.25 2.25 0 003 6.75v7.5a2.25 2.25 0 002.25 2.25h2.25V19.5l3-3h3.75a2.25 2.25 0 002.25-2.25z"
              />
            </svg>
          </div>

          <h1 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>ChatterBox</h1>
          <p className={`mt-2 ${themeClasses.textSecondary} font-medium`}>
            Login to your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  const error = validateEmail(e.target.value)
                  setErrors(prev => ({ ...prev, email: error }))
                }
              }}
              onBlur={(e) => {
                const error = validateEmail(e.target.value)
                setErrors(prev => ({ ...prev, email: error }))
              }}
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent ${
                errors.email ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) {
                  const error = validatePassword(e.target.value)
                  setErrors(prev => ({ ...prev, password: error }))
                }
              }}
              onBlur={(e) => {
                const error = validatePassword(e.target.value)
                setErrors(prev => ({ ...prev, password: error }))
              }}
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent ${
                errors.password ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="#"
              className={`text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.textAccent} transition`}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-lg py-2.5 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.btnPrimary}`}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${themeClasses.textSecondary}`}>
          Don't have an account?{' '}
          <Link href="/signup" className={`font-semibold ${themeClasses.textAccent} hover:underline`}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

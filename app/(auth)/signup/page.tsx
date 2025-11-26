'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { themeClasses } from '@/utils/theme'
import { getApiUrl } from '@/utils/config'

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  adminCode?: string
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [adminCode, setAdminCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  // Validation functions
  const validateFirstName = (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'First name is required'
    }
    if (trimmed.length > 30) {
      return 'First name must be at most 30 characters'
    }
    return undefined
  }

  const validateLastName = (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Last name is required'
    }
    if (trimmed.length > 30) {
      return 'Last name must be at most 30 characters'
    }
    return undefined
  }

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
    if (value.length < 8) {
      return 'Password must be at least 8 characters'
    }
    return undefined
  }

  const validateAdminCode = (value: string): string | undefined => {
    if (role === 'admin' && !value.trim()) {
      return 'Admin code is required'
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const firstNameError = validateFirstName(firstName)
    if (firstNameError) newErrors.firstName = firstNameError
    
    const lastNameError = validateLastName(lastName)
    if (lastNameError) newErrors.lastName = lastNameError
    
    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    if (role === 'admin') {
      const adminCodeError = validateAdminCode(adminCode)
      if (adminCodeError) newErrors.adminCode = adminCodeError
    }
    
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
      const response = await axios.post(getApiUrl('api/auth/register'), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === 'admin' && { adminCode }),
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
        // Check for validation errors
        if (err.response?.status === 422 && err.response?.data?.errors) {
          const validationErrors = err.response.data.errors
            .map((error: any) => error.msg || error.message)
            .join(', ')
          setError(validationErrors || 'Validation failed')
        } else {
          const errorMessage = err.response?.data?.message || err.message || 'Registration failed'
          setError(errorMessage)
        }
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
            Create your account
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
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (errors.firstName) {
                  const error = validateFirstName(e.target.value)
                  setErrors(prev => ({ ...prev, firstName: error }))
                }
              }}
              onBlur={(e) => {
                const error = validateFirstName(e.target.value)
                setErrors(prev => ({ ...prev, firstName: error }))
              }}
              maxLength={30}
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent ${
                errors.firstName ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (errors.lastName) {
                  const error = validateLastName(e.target.value)
                  setErrors(prev => ({ ...prev, lastName: error }))
                }
              }}
              onBlur={(e) => {
                const error = validateLastName(e.target.value)
                setErrors(prev => ({ ...prev, lastName: error }))
              }}
              maxLength={30}
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent ${
                errors.lastName ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

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
              placeholder="Password (min. 8 characters)"
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
              minLength={8}
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent ${
                errors.password ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
              Account Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === 'user'}
                  onChange={(e) => {
                    setRole(e.target.value as 'user' | 'admin')
                    setAdminCode('')
                    setErrors(prev => ({ ...prev, adminCode: undefined }))
                  }}
                  className="mr-2 accent-[#2FB8A8]"
                />
                <span className={`text-sm ${themeClasses.textPrimary}`}>User</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => {
                    setRole(e.target.value as 'user' | 'admin')
                    setErrors(prev => ({ ...prev, adminCode: undefined }))
                  }}
                  className="mr-2 accent-[#2FB8A8]"
                />
                <span className={`text-sm ${themeClasses.textPrimary}`}>Admin</span>
              </label>
            </div>
          </div>

          {role === 'admin' && (
            <div>
              <input
                type="password"
                placeholder="Admin Signup Code"
                value={adminCode}
                onChange={(e) => {
                  setAdminCode(e.target.value)
                  if (errors.adminCode) {
                    const error = validateAdminCode(e.target.value)
                    setErrors(prev => ({ ...prev, adminCode: error }))
                  }
                }}
                onBlur={(e) => {
                  const error = validateAdminCode(e.target.value)
                  setErrors(prev => ({ ...prev, adminCode: error }))
                }}
                className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent ${
                  errors.adminCode ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
              {errors.adminCode && (
                <p className="mt-1 text-sm text-red-600">{errors.adminCode}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${themeClasses.textSecondary}`}>
          Already have an account?{' '}
          <Link href="/login" className={`font-semibold ${themeClasses.textAccent} hover:underline`}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
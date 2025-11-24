'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { themeClasses } from '@/utils/theme'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [adminCode, setAdminCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          firstName,
          lastName,
          email,
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

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent`}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent`}
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent`}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent`}
            />
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
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
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
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
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
                onChange={(e) => setAdminCode(e.target.value)}
                required
                className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent`}
              />
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
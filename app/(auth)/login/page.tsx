'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { themeClasses } from '@/utils/theme'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full rounded-lg ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border px-4 py-2.5 ${themeClasses.textPrimary} placeholder-[#8E9398] focus:outline-none focus:ring-2 focus:ring-[#2FB8A8] focus:border-transparent`}
            />
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

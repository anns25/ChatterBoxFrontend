'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

export default function SignupPage() {
  const [name, setName] = useState('')
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
          name,
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
        window.location.href = '/'
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const errorMessage = err.response?.data?.message || err.message || 'Registration failed'
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-sm">
        <div className="text-center mb-6">
          {/* Logo or Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500">
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

          <h1 className="text-3xl font-bold text-gray-900">ChatterBox</h1>
          <p className="mt-2 text-gray-600 font-medium">
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
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">User</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Admin</span>
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <p className="mt-4 text-center text-sm text-gray-700">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-green-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
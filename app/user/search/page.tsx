'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import Sidebar from '../../../components/Sidebar'
import { User } from '../../../types'
import { getFullName, getUserInitials } from '@/utils/userUtils'
import { themeClasses } from '@/utils/theme'
import { API_BASE_URL, getApiUrl } from '@/utils/config'

interface SearchResultUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  profilePicture?: string
}

export default function SearchPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const socketRef = useRef<Socket | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load user from localStorage after mount
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch {
      router.push('/login')
    }
  }, [router])

  // Initialize Socket.IO for online status
  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')
    if (!token) return

    socketRef.current = io(API_BASE_URL, {
      auth: { token },
    })

    socketRef.current.on('userOnline', (userId: string) => {
      setOnlineUsers((prev) => new Set(prev).add(userId))
    })

    socketRef.current.on('userOffline', (userId: string) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [user])

    // Debounced search with API call
    useEffect(() => {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
  
      // Set searching state
      setIsSearching(true)
  
      // Debounce the API call
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token')
          
          if (!token) {
            router.push('/login')
            return
          }
  
          // If search query is empty, fetch all users
          const queryParam = searchQuery.trim() 
            ? `?q=${encodeURIComponent(searchQuery.trim())}` 
            : ''
  
          const response = await axios.get(
            getApiUrl(`api/users/search${queryParam}`),
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
  
          // Backend already excludes current user, but filter again as safety measure
          const filteredResults = response.data.filter(
            (result: SearchResultUser) => result._id !== user?.id
          )
          
          setSearchResults(filteredResults)
        } catch (error) {
          console.error('Error searching users:', error)
          
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              // Unauthorized - redirect to login
              router.push('/login')
              return
            } else if (error.response?.status === 404) {
              // Endpoint not found - show empty results
              setSearchResults([])
            } else {
              // Other errors - show empty results
              setSearchResults([])
            }
          } else {
            setSearchResults([])
          }
        } finally {
          setIsSearching(false)
        }
      }, 300) // 300ms debounce
  
      // Cleanup function
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
      }
    }, [searchQuery, user, router])

  const handleStartChat = async (otherUser: SearchResultUser) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      // Create or get existing chat
      const response = await axios.post(
        getApiUrl('api/chats'),
        { participantId: otherUser._id },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      // Navigate to chat page with the chat ID
      router.push(`/user?chatId=${response.data._id}`)
    } catch (error) {
      console.error('Error starting chat:', error)
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push('/login')
        } else {
          // Show error message but still navigate
          alert(error.response?.data?.message || 'Failed to start chat')
          router.push('/user')
        }
      } else {
        router.push('/user')
      }
    }
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId)
  }

  if (!user) {
    return (
      <div className={`flex items-center justify-center h-screen ${themeClasses.bgPrimary}`}>
        <div className={themeClasses.textSecondary}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen overflow-hidden ${themeClasses.bgPrimary}`}>
      <Sidebar user={user} currentPage="search" />

      <div className={`flex-1 flex flex-col min-h-0 ${themeClasses.bgSecondary} overflow-y-auto`}>
        {/* Header */}
        <div className={`flex-shrink-0 p-4 max-[540px]:p-3 md:p-6 border-b ${themeClasses.borderSecondary}`}>
          <h1 className={`text-xl max-[540px]:text-lg md:text-2xl font-bold ${themeClasses.textPrimary}`}>Search Users</h1>
          <p className={`text-xs max-[540px]:text-xs md:text-sm ${themeClasses.textSecondary} mt-1`}>
            Find and connect with other users
          </p>
        </div>

        {/* Search Input */}
        <div className={`flex-shrink-0 p-4 max-[540px]:p-3 md:p-6 border-b ${themeClasses.borderSecondary}`}>
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none`}>
              <svg
                className={`h-4 w-4 max-[540px]:h-4 md:h-5 max-[540px]:w-4 md:w-5 ${themeClasses.textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className={`block w-full pl-8 max-[540px]:pl-8 md:pl-10 pr-3 py-2 max-[540px]:py-2 md:py-3 text-sm max-[540px]:text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent} placeholder:${themeClasses.textMuted}`}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className={`animate-spin rounded-full h-4 w-4 max-[540px]:h-4 md:h-5 max-[540px]:w-4 md:w-5 border-b-2 ${themeClasses.borderAccent}`}></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 max-[540px]:p-3 md:p-6">
          {searchResults.length === 0 && !isSearching ? (
            <div className="text-center py-8 max-[540px]:py-6 md:py-12">
              <svg
                className={`mx-auto h-10 w-10 max-[540px]:h-8 max-[540px]:w-8 md:h-12 md:w-12 ${themeClasses.textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className={`mt-2 text-xs max-[540px]:text-xs md:text-sm font-medium ${themeClasses.textPrimary}`}>No users found</h3>
              <p className={`mt-1 text-xs max-[540px]:text-xs md:text-sm ${themeClasses.textMuted}`}>
                {searchQuery.trim() 
                  ? 'Try searching with a different name or email'
                  : 'No users available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-[540px]:space-y-2 md:space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  className={`flex items-center justify-between max-[540px]:flex-col max-[540px]:items-center max-[540px]:gap-3 p-3 max-[540px]:p-3 md:p-4 ${themeClasses.bgTertiary} rounded-lg hover:${themeClasses.bgAccentHover} transition ${themeClasses.borderSecondary} border`}
                >
                  <div className="flex items-center space-x-3 max-[540px]:space-x-3 md:space-x-4 w-full max-[540px]:w-full">
                    <div className="relative flex-shrink-0">
                      {result.profilePicture ? (
                        <img 
                          src={result.profilePicture} 
                          alt={getFullName(result.firstName, result.lastName)}
                          className="w-10 h-10 max-[540px]:w-10 max-[540px]:h-10 md:w-12 md:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 max-[540px]:w-10 max-[540px]:h-10 md:w-12 md:h-12 rounded-full ${themeClasses.bgAccent} flex items-center justify-center`}>
                          <span className="text-white font-semibold text-base max-[540px]:text-base md:text-lg">
                            {getUserInitials(result.firstName, result.lastName)}
                          </span>
                        </div>
                      )}
                      {isUserOnline(result._id) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 max-[540px]:w-2.5 max-[540px]:h-2.5 md:w-3 md:h-3 rounded-full border-2" style={{ backgroundColor: '#2FB8A8', borderColor: '#16181D' }}></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 max-[540px]:text-left">
                      <p className={`font-semibold text-sm max-[540px]:text-sm md:text-base ${themeClasses.textPrimary} truncate`}>{getFullName(result.firstName, result.lastName)}</p>
                      <p className={`text-xs max-[540px]:text-xs md:text-sm ${themeClasses.textSecondary} truncate`}>{result.email}</p>
                      {result.role && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium ${themeClasses.bgAccent} ${themeClasses.textPrimary} rounded`}>
                          {result.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(result)}
                    className={`whitespace-nowrap max-[540px]:w-full px-4 py-2 ${themeClasses.btnPrimary} max-[540px]:mt-0 rounded-lg transition font-medium text-sm max-[540px]:text-sm`}
                  >
                    Start Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
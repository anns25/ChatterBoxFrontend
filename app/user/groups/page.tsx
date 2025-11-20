'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Sidebar from '../../../components/Sidebar'
import { User, Chat } from '@/types'
import { getFullName } from '@/utils/userUtils'

export default function GroupsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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

  // Search for users to add to group
  useEffect(() => {
    if (!searchQuery.trim() || !user) return

    const searchUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setSearchResults(response.data)
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, user])

  const handleAddParticipant = (participant: User | any) => {
    const participantId = (participant as any).id || (participant as any)._id
    if (!selectedParticipants.find(p => p.id === participantId)) {
      // Normalize the participant object to use 'id'
      const normalizedParticipant: User = {
        id: participantId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        role: (participant as any).role || 'user',
      }
      setSelectedParticipants([...selectedParticipants, normalizedParticipant])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveParticipant = (participantId: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== participantId))
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!groupName.trim()) {
      setError('Group name is required')
      return
    }

    if (selectedParticipants.length === 0) {
      setError('Please add at least one participant')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:5000/api/chats/group',
        {
          groupName: groupName.trim(),
          participantIds: selectedParticipants.map(p => p.id),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Navigate to the new group chat
      router.push(`/user?chatId=${response.data._id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to create group')
      } else {
        setError('Failed to create group')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} onLogout={handleLogout} currentPage="groups" />

      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create Group Chat</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a group chat with multiple participants
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="flex-1 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Participants
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
                {searchResults
                  .filter(result => {
                    const resultId = (result as any).id || (result as any)._id
                    return !selectedParticipants.find(p => p.id === resultId)
                  })
                  .map((result) => {
                    const resultId = (result as any).id || (result as any)._id
                    return (
                      <div
                        key={resultId}
                        onClick={() => handleAddParticipant(result)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">{getFullName(result.firstName, result.lastName)}</p>
                        <p className="text-sm text-gray-600">{result.email}</p>
                      </div>
                    )
                })}
          </div>

          {selectedParticipants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Participants ({selectedParticipants.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full"
                  >
                    <span className="text-sm font-medium text-blue-900">
                      {getFullName(participant.firstName, participant.lastName)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !groupName.trim() || selectedParticipants.length === 0}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Group Chat'}
          </button>
        </form>
      </div>
    </div>
  )
}
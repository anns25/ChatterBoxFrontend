'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Sidebar from '../../../components/Sidebar'
import { User, Chat } from '@/types'
import { getFullName } from '@/utils/userUtils'
import { themeClasses } from '@/utils/theme'
import { API_BASE_URL, getApiUrl } from '@/utils/config'

interface FormErrors {
  groupName?: string
  participants?: string
}

type UserWithId = User | {
  _id: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role?: string
  profilePicture?: string
}

// Helper function to get user ID
const getUserId = (user: UserWithId): string => {
  return (user as User).id || (user as { _id: string })._id
}

export default function GroupsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [groupPicture, setGroupPicture] = useState<File | null>(null)
  
  // For editing existing groups
  const [editingGroup, setEditingGroup] = useState<Chat | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null)
  const [editGroupPicture, setEditGroupPicture] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({})
  const [editErrors, setEditErrors] = useState<FormErrors>({})
  
  // For listing admin groups
  const [adminGroups, setAdminGroups] = useState<Chat[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

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
      fetchAdminGroups()
    } catch {
      router.push('/login')
    }
  }, [router])

  const fetchAdminGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        getApiUrl('api/chats/admin-groups'),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setAdminGroups(response.data)
    } catch (error) {
      console.error('Error fetching admin groups:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // Search for users to add to group
  useEffect(() => {
    if (!searchQuery.trim() || !user) return

    const searchUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          getApiUrl(`api/users/search?q=${encodeURIComponent(searchQuery)}`),
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

  const handleAddParticipant = (participant: UserWithId) => {
    const participantId = getUserId(participant)
    if (!selectedParticipants.find(p => p.id === participantId)) {
      // Normalize the participant object to use 'id'
      const normalizedParticipant: User = {
        id: participantId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        role: participant.role || 'user',
      }
      setSelectedParticipants([...selectedParticipants, normalizedParticipant])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveParticipant = (participantId: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== participantId))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setGroupPicture(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setEditGroupPicture(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Validation functions
  const validateGroupName = (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Group name is required'
    }
    return undefined
  }

  const validateParticipants = (participants: User[]): string | undefined => {
    if (!participants || participants.length === 0) {
      return 'At least one participant is required'
    }
    return undefined
  }

  const validateCreateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const groupNameError = validateGroupName(groupName)
    if (groupNameError) newErrors.groupName = groupNameError
    
    const participantsError = validateParticipants(selectedParticipants)
    if (participantsError) newErrors.participants = participantsError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateEditForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const groupNameError = validateGroupName(editGroupName)
    if (groupNameError) newErrors.groupName = groupNameError
    
    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form before submission
    if (!validateCreateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('groupName', groupName.trim())
      formData.append('participantIds', JSON.stringify(selectedParticipants.map(p => p.id)))
      
      if (groupPicture) {
        formData.append('groupPicture', groupPicture)
      }

      await axios.post(
        getApiUrl('api/chats/group'),
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // Reset form
      setGroupName('')
      setSelectedParticipants([])
      setPreviewImage(null)
      setGroupPicture(null)
      setShowCreateForm(false)
      setErrors({})
      
      // Refresh groups list
      fetchAdminGroups()
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

  const handleEditGroup = (group: Chat) => {
    setEditingGroup(group)
    setEditGroupName(group.groupName || '')
    setEditPreviewImage(group.groupPicture || null)
    setEditGroupPicture(null)
    setIsEditing(true)
    setShowCreateForm(false)
  }

  const handleCancelEdit = () => {
    setEditingGroup(null)
    setEditGroupName('')
    setEditPreviewImage(null)
    setEditGroupPicture(null)
    setIsEditing(false)
  }

  const handleUpdateGroupName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    setError('')

    // Validate form before submission
    if (!validateEditForm()) {
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        getApiUrl(`api/chats/group/${editingGroup._id}/name`),
        { groupName: editGroupName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      handleCancelEdit()
      fetchAdminGroups()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to update group name')
      } else {
        setError('Failed to update group name')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateGroupPicture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    const fileInput = document.getElementById('editGroupPictureInput') as HTMLInputElement
    const file = editGroupPicture || fileInput?.files?.[0]
    
    if (!file) {
      setError('Please select an image file')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('groupPicture', file)

      await axios.patch (
        getApiUrl(`api/chats/group/${editingGroup._id}/picture`),
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      handleCancelEdit()
      fetchAdminGroups()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to update group picture')
      } else {
        setError('Failed to update group picture')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGroupPicture = async () => {
    if (!editingGroup) return

    if (!confirm('Are you sure you want to remove the group picture?')) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        getApiUrl(`api/chats/group/${editingGroup._id}/picture`),
        { headers: { Authorization: `Bearer ${token}` } }
      )

      handleCancelEdit()
      fetchAdminGroups()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to remove group picture')
      } else {
        setError('Failed to remove group picture')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenGroup = (groupId: string) => {
    router.push(`/user?chatId=${groupId}`)
  }


  if (!user) {
    return (
      <div className={`flex items-center justify-center h-screen ${themeClasses.bgPrimary}`}>
        <div className={themeClasses.textSecondary}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${themeClasses.bgPrimary}`}>
      <Sidebar user={user} currentPage="groups" />

      <div className={`flex-1 flex flex-col ${themeClasses.bgSecondary} overflow-y-auto`}>
        <div className={`p-6 border-b ${themeClasses.borderSecondary} flex justify-between items-center`}>
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>My Group Chats</h1>
            <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
              Manage your group chats
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setIsEditing(false)
              handleCancelEdit()
            }}
            className={`px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium`}
          >
            {showCreateForm ? 'Cancel' : '+ Create Group'}
          </button>
        </div>

        {error && (
          <div className={`mx-6 mt-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm`}>
            {error}
          </div>
        )}

        {/* Edit Group Form */}
        {isEditing && editingGroup && (
          <div className={`p-6 border-b ${themeClasses.borderSecondary}`}>
            <h2 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-4`}>
              Edit Group: {editingGroup.groupName}
            </h2>
            
            <div className="space-y-4">
              {/* Group Picture */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Group Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {editPreviewImage ? (
                      <img
                        src={editPreviewImage}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4"
                        style={{ borderColor: '#2FB8A8' }}
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${themeClasses.bgAccent} border-4`} style={{ borderColor: '#2FB8A8' }}>
                        <span className="text-3xl font-semibold text-white">
                          {editGroupName.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      id="editGroupPictureInput"
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className={`block w-full text-sm ${themeClasses.textSecondary} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${themeClasses.bgTertiary} ${themeClasses.textAccent} hover:opacity-80`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateGroupPicture}
                        disabled={!editGroupPicture && !editPreviewImage}
                        className={`px-4 py-2 ${themeClasses.btnPrimary} rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Update Picture
                      </button>
                      {editingGroup.groupPicture && (
                        <button
                          onClick={handleDeleteGroupPicture}
                          className={`px-4 py-2 ${themeClasses.bgTertiary} ${themeClasses.textSecondary} border ${themeClasses.borderSecondary} rounded-lg text-sm hover:opacity-80`}
                        >
                          Remove Picture
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Name */}
              <form onSubmit={handleUpdateGroupName}>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Group Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => {
                        setEditGroupName(e.target.value)
                        if (editErrors.groupName) {
                          const error = validateGroupName(e.target.value)
                          setEditErrors(prev => ({ ...prev, groupName: error }))
                        }
                      }}
                      onBlur={(e) => {
                        const error = validateGroupName(e.target.value)
                        setEditErrors(prev => ({ ...prev, groupName: error }))
                      }}
                      placeholder="Enter group name"
                      className={`flex-1 px-4 py-2 ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent} placeholder:${themeClasses.textMuted} ${
                        editErrors.groupName ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !editGroupName.trim()}
                      className={`px-4 py-2 ${themeClasses.btnPrimary} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className={`px-4 py-2 ${themeClasses.bgTertiary} ${themeClasses.textSecondary} border ${themeClasses.borderSecondary} rounded-lg hover:opacity-80`}
                    >
                      Cancel
                    </button>
                  </div>
                  {editErrors.groupName && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.groupName}</p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Group Form */}
        {showCreateForm && !isEditing && (
          <div className={`p-6 border-b ${themeClasses.borderSecondary}`}>
            <h2 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-4`}>
              Create New Group Chat
            </h2>
            <form onSubmit={handleCreateGroup} className="space-y-6">
              {/* Group Picture Upload */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Group Picture (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4"
                        style={{ borderColor: '#2FB8A8' }}
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${themeClasses.bgAccent} border-4`} style={{ borderColor: '#2FB8A8' }}>
                        <span className="text-3xl font-semibold text-white">
                          {groupName.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      id="groupPictureInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`block w-full text-sm ${themeClasses.textSecondary} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${themeClasses.bgTertiary} ${themeClasses.textAccent} hover:opacity-80`}
                    />
                    <p className={`mt-1 text-xs ${themeClasses.textMuted}`}>
                      JPG, PNG, GIF or WEBP. Max size: 5MB
                    </p>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null)
                          setGroupPicture(null)
                          const fileInput = document.getElementById('groupPictureInput') as HTMLInputElement
                          if (fileInput) fileInput.value = ''
                        }}
                        className={`mt-2 text-xs ${themeClasses.textAccent} hover:underline`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value)
                    if (errors.groupName) {
                      const error = validateGroupName(e.target.value)
                      setErrors(prev => ({ ...prev, groupName: error }))
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateGroupName(e.target.value)
                    setErrors(prev => ({ ...prev, groupName: error }))
                  }}
                  placeholder="Enter group name"
                  className={`w-full px-4 py-2 ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent} placeholder:${themeClasses.textMuted} ${
                    errors.groupName ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.groupName && (
                  <p className="mt-1 text-sm text-red-600">{errors.groupName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Add Participants
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for users..."
                  className={`w-full px-4 py-2 ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent} placeholder:${themeClasses.textMuted}`}
                />
                {searchResults
                  .filter(result => {
                    const resultId = getUserId(result)
                    return !selectedParticipants.find(p => p.id === resultId)
                  })
                  .map((result) => {
                    const resultId = getUserId(result)
                    return (
                      <div
                        key={resultId}
                        onClick={() => handleAddParticipant(result)}
                        className={`p-3 hover:${themeClasses.bgAccentHover} cursor-pointer border-b ${themeClasses.borderSecondary} last:border-b-0 transition`}
                      >
                        <p className={`font-medium ${themeClasses.textPrimary}`}>{getFullName(result.firstName, result.lastName)}</p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>{result.email}</p>
                      </div>
                    )
                  })}
              </div>

              {selectedParticipants.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Selected Participants ({selectedParticipants.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className={`flex items-center space-x-2 ${themeClasses.bgAccent} px-3 py-1 rounded-full`}
                      >
                        <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                          {getFullName(participant.firstName, participant.lastName)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className={`${themeClasses.textPrimary} hover:opacity-70 transition`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.participants && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errors.participants}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !groupName.trim() || selectedParticipants.length === 0}
                className={`w-full px-6 py-3 ${themeClasses.btnPrimary} rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Creating...' : 'Create Group Chat'}
              </button>
            </form>
          </div>
        )}

        {/* Admin Groups List */}
        <div className="flex-1 p-6">
          {isLoadingGroups ? (
            <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
              Loading groups...
            </div>
          ) : adminGroups.length === 0 ? (
            <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
              <p className="text-lg mb-2">You haven&apos;created any groups yet.</p>
              <p className="text-sm">Click &quot;Create Group&quot; to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminGroups.map((group) => (
                <div
                  key={group._id}
                  className={`p-4 ${themeClasses.bgTertiary} border ${themeClasses.borderSecondary} rounded-lg hover:${themeClasses.borderAccent} transition cursor-pointer`}
                  onClick={() => handleOpenGroup(group._id)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    {group.groupPicture ? (
                      <img
                        src={group.groupPicture}
                        alt={group.groupName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${themeClasses.bgAccent}`}>
                        <span className="text-lg font-semibold text-white">
                          {group.groupName?.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${themeClasses.textPrimary} truncate`}>
                        {group.groupName}
                      </h3>
                      <p className={`text-xs ${themeClasses.textSecondary}`}>
                        {group.participants?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditGroup(group)
                    }}
                    className={`w-full px-3 py-2 ${themeClasses.bgAccent} ${themeClasses.textPrimary} rounded-lg text-sm font-medium hover:opacity-80 transition`}
                  >
                    Edit Group
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
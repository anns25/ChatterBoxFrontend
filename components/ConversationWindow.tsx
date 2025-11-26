'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Message, Chat } from '@/types'
import { getUserInitials, getFullName } from '../utils/userUtils'
import MessageRewriteModal from './MessageRewriteModal'
import { themeClasses, themeStyles, componentStyles } from '../utils/theme'
import axios from 'axios'

interface ConversationWindowProps {
  selectedChat: Chat | null
  messages: Message[]
  currentUserId: string
  messageInput: string
  setMessageInput: (value: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onTyping: () => void
  isTyping: boolean
  onlineUsers: Set<string>
  onBack?: () => void
}

interface FormErrors {
  groupName?: string
}

export default function ConversationWindow({
  selectedChat,
  messages,
  currentUserId,
  messageInput,
  setMessageInput,
  onSendMessage,
  onTyping,
  isTyping,
  onlineUsers,
  onBack,
}: ConversationWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showRewriteModal, setShowRewriteModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPicture, setIsEditingPicture] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return 'Just now'
    
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'Just now'
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    
    // Format time (HH:MM)
    const timeStr = d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return timeStr
    if (messageDate.getTime() === today.getTime()) {
      // Today - show time only
      return timeStr
    } else {
      const days = Math.floor(diff / 86400000)
      if (days === 1) {
        // Yesterday
        return `Yesterday ${timeStr}`
      } else if (days < 7) {
        // This week - show day and time
        return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${timeStr}`
      } else {
        // Older - show date and time
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`
      }
    }
  }

  const formatDateSeparator = (date: Date | string | undefined) => {
    if (!date) return 'Today'
    
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'Today'
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Today'
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else {
      return d.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | undefined) => {
    if (!previousMessage) return true
    
    // Get timestamp from either 'timestamp' or 'createdAt' field
    const currentTimestamp = currentMessage.timestamp || (currentMessage as Message).createdAt
    const previousTimestamp = previousMessage.timestamp || (previousMessage as Message).createdAt
    
    if (!currentTimestamp || !previousTimestamp) return false
    
    const currentDate = new Date(currentTimestamp)
    const previousDate = new Date(previousTimestamp)
    
    // Check if dates are valid
    if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
      return false
    }
    
    const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const previousDay = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate())
    
    return currentDay.getTime() !== previousDay.getTime()
  }

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p._id !== currentUserId) || chat.participants[0]
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId)
  }

  if (!selectedChat) {
    return (
      <div className={`flex-1 flex items-center justify-center ${themeClasses.textSecondary} ${themeClasses.bgSecondary}`}>
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className={`${themeClasses.textSecondary}`}>Select a chat to start messaging</p>
        </div>
      </div>
    )
  }

  const otherUser = getOtherParticipant(selectedChat)
  const isGroupChat = selectedChat.isGroupChat
  const isAdmin = isGroupChat && selectedChat.admin?._id === currentUserId
  const isOnline = !isGroupChat && isUserOnline(otherUser._id)
  const displayName = isGroupChat 
    ? (selectedChat.groupName || 'Group Chat') 
    : getFullName(otherUser.firstName, otherUser.lastName)
  
  const displayAvatar = isGroupChat 
    ? (selectedChat.groupName?.charAt(0).toUpperCase() || 'G')
    : (otherUser.profilePicture 
        ? null 
        : getUserInitials(otherUser.firstName, otherUser.lastName))

  // Validation function
  const validateGroupName = (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Group name is required'
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const error = validateGroupName(newGroupName)
    setErrors({ groupName: error })
    return !error
  }

  const handleEditGroupName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChat) return

    setError('')

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    setIsUploading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `http://localhost:5000/api/chats/group/${selectedChat._id}/name`,
        { groupName: newGroupName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess('Group name updated successfully!')
      setIsEditingName(false)
      setNewGroupName('')
      setErrors({})
      
      setTimeout(() => {
        setSuccess('')
        window.location.reload()
      }, 2000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to update group name')
      } else {
        setError('Failed to update group name')
      }
    } finally {
      setIsUploading(false)
    }
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

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadGroupPicture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChat) return

    const fileInput = document.getElementById('groupPictureInput') as HTMLInputElement
    const file = fileInput?.files?.[0]
    
    if (!file) {
      setError('Please select an image file')
      return
    }

    setError('')
    setIsUploading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('groupPicture', file)

      const response = await axios.patch (
        `http://localhost:5000/api/chats/group/${selectedChat._id}/picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setSuccess('Group picture updated successfully!')
      setPreviewImage(null)
      setIsEditingPicture(false)
      if (fileInput) fileInput.value = ''
      
      setTimeout(() => {
        setSuccess('')
        window.location.reload()
      }, 2000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to upload group picture')
      } else {
        setError('Failed to upload group picture')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteGroupPicture = async () => {
    if (!selectedChat) return

    if (!confirm('Are you sure you want to remove the group picture?')) {
      return
    }

    setError('')
    setIsUploading(true)

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `http://localhost:5000/api/chats/group/${selectedChat._id}/picture`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess('Group picture removed successfully!')
      setIsEditingPicture(false)
      
      setTimeout(() => {
        setSuccess('')
        window.location.reload()
      }, 2000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to remove group picture')
      } else {
        setError('Failed to remove group picture')
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${themeClasses.bgPrimary}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${themeClasses.borderPrimary}`}>
        <div className="flex items-center space-x-3">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className={`md:hidden mr-2 p-2 rounded-lg hover:${themeClasses.bgTertiary} transition ${themeClasses.textPrimary}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div className="flex items-center space-x-3">
            <div className="relative">
              {isGroupChat ? (
                selectedChat.groupPicture ? (
                  <img
                    src={selectedChat.groupPicture}
                    alt={selectedChat.groupName || 'Group'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeClasses.bgAccent}`}>
                    <span className="text-white font-semibold">{displayAvatar}</span>
                  </div>
                )
              ) : otherUser.profilePicture ? (
                <img
                  src={otherUser.profilePicture} 
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeClasses.bgAccent}`}>
                  <span className="text-white font-semibold">{displayAvatar}</span>
                </div>
              )}
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ backgroundColor: '#2FB8A8', borderColor: '#16181D' }}></div>
              )}
            </div>
            <div>
              <p className={`font-semibold ${themeClasses.textPrimary}`}>{displayName}</p>
              <p className={`text-xs ${themeClasses.textSecondary}`}>
                {isGroupChat 
                  ? `${selectedChat.participants?.length || 0} participants`
                  : (isOnline ? 'Online' : 'Offline')
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={() => setShowEditGroupModal(true)}
            className={`p-2 rounded-lg hover:${themeClasses.bgTertiary} transition ${themeClasses.textPrimary}`}
            title="Edit group settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {(success || error) && (
        <div className={`p-3 mx-4 mt-2 rounded-lg text-sm ${
          success ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
        }`}>
          {success || error}
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${themeClasses.bgSecondary} ${themeClasses.borderPrimary} border`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>Edit Group</h2>
              <button
                onClick={() => {
                  setShowEditGroupModal(false)
                  setIsEditingName(false)
                  setIsEditingPicture(false)
                  setNewGroupName('')
                  setPreviewImage(null)
                  setError('')
                }}
                className={themeClasses.textSecondary}
              >
                ✕
              </button>
            </div>

            {/* Edit Group Name */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${themeClasses.textSecondary}`}>Group Name</label>
                {!isEditingName && (
                  <button
                    onClick={() => {
                      setIsEditingName(true)
                      setNewGroupName(selectedChat?.groupName || '')
                      setError('')
                    }}
                    className={`text-xs ${themeClasses.textAccent} hover:underline`}
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingName ? (
                <form onSubmit={handleEditGroupName} className="space-y-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => {
                      setNewGroupName(e.target.value)
                      if (errors.groupName) {
                        const error = validateGroupName(e.target.value)
                        setErrors({ groupName: error })
                      }
                    }}
                    onBlur={(e) => {
                      const error = validateGroupName(e.target.value)
                      setErrors({ groupName: error })
                    }}
                    className={`w-full px-4 py-2 ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent} ${
                      errors.groupName ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    autoFocus
                  />
                  {errors.groupName && (
                    <p className="text-sm text-red-600">{errors.groupName}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={isUploading || !newGroupName.trim()}
                      className={`px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                    >
                      {isUploading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false)
                        setNewGroupName('')
                        setError('')
                      }}
                      className={`px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className={`${themeClasses.textPrimary}`}>{selectedChat?.groupName || 'No name'}</p>
              )}
            </div>

            {/* Edit Group Picture */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${themeClasses.textSecondary}`}>Group Picture</label>
                {!isEditingPicture && selectedChat?.groupPicture && (
                  <button
                    onClick={handleDeleteGroupPicture}
                    disabled={isUploading}
                    className={`text-xs text-red-400 hover:underline disabled:opacity-50`}
                  >
                    Remove
                  </button>
                )}
              </div>
              {isEditingPicture ? (
                <form onSubmit={handleUploadGroupPicture} className="space-y-3">
                  <div className="flex justify-center mb-3">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4"
                        style={{ borderColor: '#2FB8A8' }}
                      />
                    ) : selectedChat?.groupPicture ? (
                      <img
                        src={selectedChat.groupPicture}
                        alt={selectedChat.groupName || 'Group'}
                        className="w-32 h-32 rounded-full object-cover border-4"
                        style={{ borderColor: '#2FB8A8' }}
                      />
                    ) : (
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center ${themeClasses.bgAccent} border-4`} style={{ borderColor: '#2FB8A8' }}>
                        <span className="text-4xl font-semibold text-white">
                          {selectedChat?.groupName?.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    id="groupPictureInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={`block w-full text-sm ${themeClasses.textSecondary} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${themeClasses.bgTertiary} ${themeClasses.textAccent} hover:opacity-80`}
                  />
                  <p className={`text-xs ${themeClasses.textMuted}`}>
                    JPG, PNG, GIF or WEBP. Max size: 5MB
                  </p>
                  {previewImage && (
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={isUploading}
                        className={`px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null)
                          const fileInput = document.getElementById('groupPictureInput') as HTMLInputElement
                          if (fileInput) fileInput.value = ''
                        }}
                        className={`px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    {selectedChat?.groupPicture ? (
                      <img
                        src={selectedChat.groupPicture}
                        alt={selectedChat.groupName || 'Group'}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${themeClasses.bgAccent}`}>
                        <span className="text-3xl font-semibold text-white">
                          {selectedChat?.groupName?.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditingPicture(true)}
                    className={`w-full px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                  >
                    {selectedChat?.groupPicture ? 'Change Picture' : 'Add Picture'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.map((message, index) => {
          const isOwn = message.sender === currentUserId
          const previousMessage = index > 0 ? messages[index - 1] : undefined
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
          
          // Get timestamp from either 'timestamp' or 'createdAt' field
          const messageTimestamp = message.timestamp || (message as Message).createdAt || new Date()
          
          // For group chats, check if we should show sender name
          const isGroupChat = selectedChat?.isGroupChat
          const showSenderName = isGroupChat && !isOwn && message.senderName
          const previousMessageSameSender = previousMessage && 
            previousMessage.sender === message.sender &&
            !shouldShowDateSeparator(message, previousMessage)

            // Get sender name for display (with fallback)
          const getSenderDisplayName = () => {
            if (message.senderName) {
              return message.senderName
            }
            // Fallback: try to find sender in participants
            if (selectedChat && isGroupChat) {
              const senderParticipant = selectedChat.participants.find(p => p._id === message.sender)
              if (senderParticipant) {
                return getFullName(senderParticipant.firstName, senderParticipant.lastName)
              }
            }
            return 'Unknown'
          }

          const senderDisplayName = getSenderDisplayName()
          const senderInitial = senderDisplayName.charAt(0).toUpperCase()

          const getSenderParticipant = () => {
            if (selectedChat && isGroupChat) {
              return selectedChat.participants.find(p => p._id === message.sender)
            }
            return null
          }

          const senderParticipant = getSenderParticipant()
          const senderProfilePicture = senderParticipant?.profilePicture
          const senderInitials = senderParticipant 
            ? getUserInitials(senderParticipant.firstName, senderParticipant.lastName)
            : senderInitial

          return (
            <React.Fragment key={message._id || `temp-${index}`}>
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <div className={`px-3 py-1 rounded-full text-xs ${themeClasses.bgSecondary} ${themeClasses.textSecondary}`}>
                    {formatDateSeparator(messageTimestamp)}
                  </div>
                </div>
              )}
              <div
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 ${
                  isGroupChat ? 'items-start' : 'items-end'
                }`}
              >
                {/* Show avatar for group chats when sender changes */}
                {isGroupChat && !isOwn && (!previousMessageSameSender || showDateSeparator) && (
                  <div className="mr-2 flex-shrink-0">
                    {senderProfilePicture ? (
                      <img
                        src={senderProfilePicture}
                        alt={senderDisplayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${themeClasses.bgAccent}`}>
                        <span className="text-white text-xs font-semibold">
                          {senderInitials}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex flex-col ${isOwn ? 'items-end' : `items-start ${isGroupChat && previousMessageSameSender && !showDateSeparator ? 'ml-10' : ''}`}`}>
                  {/* Show sender name for group chats */}
                  {showSenderName && (!previousMessageSameSender || showDateSeparator) && (
                    <p className={`text-xs font-medium mb-1 px-1 ${themeClasses.textSecondary}`}>
                      {senderDisplayName}
                    </p>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? `${themeClasses.bgAccent} text-white`
                        : `${themeClasses.bgSecondary} ${themeClasses.textPrimary}`
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white opacity-80' : themeClasses.textSecondary}`}>
                      {formatTime(messageTimestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`px-4 py-2 rounded-lg ${themeClasses.bgSecondary}`}>
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.bgAccent}`}></div>
                <div
                  className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.bgAccent}`}
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.bgAccent}`}
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={onSendMessage} className={`p-4 border-t flex-shrink-0 ${themeClasses.borderPrimary}`}>
        <div className="flex space-x-2">
          {messageInput.trim() && (
            <button
              type="button"
              onClick={() => setShowRewriteModal(true)}
              className={`px-3 py-2 rounded-lg transition text-2xl hover:scale-110 active:scale-95 ${themeClasses.textAccent} hover:opacity-80`}
              title="Rewrite message with AI"
            >
              ✨
            </button>
          )}
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value)
              onTyping()
            }}
            placeholder="Type a message..."
            className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.borderPrimary} ${themeClasses.bgSecondary} ${themeClasses.textPrimary} focus:ring-[#2FB8A8]`}
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={`px-6 py-2 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.btnPrimary}`}
          >
            Send
          </button>
        </div>
      </form>

      <MessageRewriteModal
        isOpen={showRewriteModal}
        onClose={() => setShowRewriteModal(false)}
        originalMessage={messageInput}
        onApply={(rewritten) => {
          setMessageInput(rewritten)
          setShowRewriteModal(false)
        }}
      />
    </div>
  )
}
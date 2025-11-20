'use client'

import React, { useEffect, useRef } from 'react'
import { Message, Chat } from '@/types'
import { getUserInitials, getFullName } from '../utils/userUtils'

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
}: ConversationWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">
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
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    )
  }

  const otherUser = getOtherParticipant(selectedChat)
  const isGroupChat = selectedChat.isGroupChat
  const isOnline = !isGroupChat && isUserOnline(otherUser._id)
  const displayName = isGroupChat 
    ? (selectedChat.groupName || 'Group Chat') 
    : getFullName(otherUser.firstName, otherUser.lastName)
  
  const displayAvatar = isGroupChat 
    ? (selectedChat.groupName?.charAt(0).toUpperCase() || 'G')
    : (otherUser.profilePicture 
        ? null 
        : getUserInitials(otherUser.firstName, otherUser.lastName))

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {isGroupChat ? (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold">{displayAvatar}</span>
              </div>
            ) : otherUser.profilePicture ? (
              <img 
                src={otherUser.profilePicture} 
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold">{displayAvatar}</span>
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{displayName}</p>
            <p className="text-xs text-gray-500">
              {isGroupChat 
                ? `${selectedChat.participants?.length || 0} participants`
                : (isOnline ? 'Online' : 'Offline')
              }
            </p>
          </div>
        </div>
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
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

          return (
            <React.Fragment key={message._id || `temp-${index}`}>
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
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
                {isGroupChat && !isOwn && (
                  <div className="mr-2 flex-shrink-0">
                    {(!previousMessageSameSender || showDateSeparator) && (
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {senderInitial}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {/* Show sender name for group chats */}
                  {showSenderName && (!previousMessageSameSender || showDateSeparator) && (
                    <p className="text-xs font-medium text-gray-600 mb-1 px-1">
                      {senderDisplayName}
                    </p>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
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
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={onSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value)
              onTyping()
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
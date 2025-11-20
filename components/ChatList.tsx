'use client'

import React from 'react'
import { Chat } from '@/types'
import { getUserInitials, getFullName } from '../utils/userUtils'

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat | null
  currentUserId: string
  onChatSelect: (chat: Chat) => void
  onlineUsers: Set<string>
}

export default function ChatList({
  chats,
  selectedChat,
  currentUserId,
  onChatSelect,
  onlineUsers,
}: ChatListProps) {
  const formatTime = (date: Date | string | undefined) => {
    if (!date) return 'Just now'
    
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'Just now'
    }
    
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    
    // For older dates, show formatted date
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getChatDisplayName = (chat: Chat) => {
    if (chat.isGroupChat && chat.groupName) {
      return chat.groupName
    }
    const otherUser = chat.participants.find(p => p._id !== currentUserId)
    return otherUser ? getFullName(otherUser.firstName, otherUser.lastName) : 'Unknown'
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroupChat) {
      // For group chats, show first letter of group name or a group icon
      const groupName = chat.groupName || 'Group'
      return groupName.charAt(0).toUpperCase()
    }
    // For individual chats, show initials
    const otherUser = chat.participants.find(p => p._id !== currentUserId)
    if (!otherUser) return '?'
    return getUserInitials(otherUser.firstName, otherUser.lastName)
  }

  const getChatSubtitle = (chat: Chat) => {
    if (chat.isGroupChat) {
      const participantCount = chat.participants.length
      return `${participantCount} ${participantCount === 1 ? 'member' : 'members'}`
    }
    // For individual chats, show online status
    const otherUser = chat.participants.find(p => p._id !== currentUserId)
    if (!otherUser) return 'Offline'
    return isUserOnline(otherUser._id) ? 'Online' : 'Offline'
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId)
  }

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p._id !== currentUserId) || chat.participants[0]
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No chats yet. Start a conversation!</p>
          </div>
        ) : (
          chats.map((chat) => {
            const otherUser = getOtherParticipant(chat)
            const isOnline = !chat.isGroupChat && isUserOnline(otherUser._id)
            
            // Get timestamp from either 'timestamp' or 'createdAt' field
            const lastMessageTime = chat.lastMessage 
              ? (chat.lastMessage.timestamp || chat.lastMessage.createdAt)
              : chat.updatedAt
            
            return (
              <div
                key={chat._id}
                onClick={() => onChatSelect(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedChat?._id === chat._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {chat.isGroupChat ? (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                    ) : (() => {
                      const otherUser = chat.participants.find(p => p._id !== currentUserId)
                      return otherUser?.profilePicture ? (
                        <img 
                          src={otherUser.profilePicture} 
                          alt={getChatDisplayName(chat)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {getChatAvatar(chat)}
                          </span>
                        </div>
                      )
                    })()}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {getChatDisplayName(chat)}
                      </p>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {chat.lastMessage ? (
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {chat.isGroupChat && chat.lastMessage.sender !== currentUserId ? (
                            <>
                              <span className="font-medium">
                                {(() => {
                                  const sender = chat.participants.find(p => p._id === chat.lastMessage?.sender)
                                  return sender ? getFullName(sender.firstName, sender.lastName) : 'Someone'
                                })()}
                              </span>{' '}
                              {chat.lastMessage.content}
                            </>
                          ) : (
                            chat.lastMessage.content
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {getChatSubtitle(chat)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
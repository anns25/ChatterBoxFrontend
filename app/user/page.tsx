'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import Sidebar from '../../components/Sidebar'
import ConversationWindow from '../../components/ConversationWindow'
import ChatList from '@/components/ChatList'
import { User, Message, Chat } from '@/types'
import { themeClasses, themeStyles, componentStyles } from '@/utils/theme'

export default function UserChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  
  const socketRef = useRef<Socket | null>(null)
  const chatIdFromUrlRef = useRef<string | null>(null)
  const hasProcessedUrlChatRef = useRef(false)
  const selectedChatRef = useRef<Chat | null>(null)

  // Keep ref synced with selectedChat state
  useEffect(() => {
    selectedChatRef.current = selectedChat
  }, [selectedChat])

  // Helper function to update participant info in a chat
  const updateParticipantInfo = useCallback((chat: Chat, senderId: string, senderName: string): Chat => {
    const senderParticipant = chat.participants.find(p => p._id === senderId)
    
    // Only update if participant exists and is missing firstName/lastName
    if (senderParticipant && (!senderParticipant.firstName || !senderParticipant.lastName) && senderName) {
      const [firstName, ...rest] = senderName.split(' ')
      const lastName = rest.join(' ') || ''
      
      const updatedParticipants = chat.participants.map(p =>
        p._id === senderId ? { ...p, firstName, lastName } : p
      )
      
      return { ...chat, participants: updatedParticipants }
    }
    
    return chat
  }, [])

  // Load user from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setUser(parsedUser)
      })
    } catch {
      router.push('/login')
    }
  }, [router])

  // Extract chatId from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get('chatId')
    if (chatId) {
      chatIdFromUrlRef.current = chatId
      hasProcessedUrlChatRef.current = false
    }
  }, [])

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const response = await axios.get(`http://localhost:5000/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Update selectedChat participants if messages have sender info
      if (selectedChatRef.current && selectedChatRef.current.isGroupChat) {
        const messagesWithSenderInfo = response.data.filter((msg: Message) => msg.senderName)
        
        if (messagesWithSenderInfo.length > 0) {
          setSelectedChat((currentChat) => {
            if (!currentChat) return currentChat
            
            let updatedChat = currentChat
            // Update participants for each unique sender in messages
            messagesWithSenderInfo.forEach((msg: Message) => {
              if (msg.senderName) {
                updatedChat = updateParticipantInfo(updatedChat, msg.sender, msg.senderName)
              }
            })
            
            return updatedChat
          })
        }
      }
      
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setMessages(response.data)
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [updateParticipantInfo])

  const fetchChats = useCallback(async (): Promise<Chat[]> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return []
      
      const response = await axios.get('http://localhost:5000/api/chats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const fetchedChats = response.data
      
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setChats(fetchedChats)
      })
      
      return fetchedChats
    } catch (error) {
      console.error('Error fetching chats:', error)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('Chats endpoint not available yet')
      }
      return []
    }
  }, [])

  const openChat = useCallback((chat: Chat) => {
    if (!chat._id) return
    
    // Always refresh chat data to ensure participants are fully populated
    setChats((currentChats) => {
      const fullChat = currentChats.find(c => c._id === chat._id)
      if (fullChat) {
        setSelectedChat(fullChat)
        requestAnimationFrame(() => {
          fetchMessages(fullChat._id)
          if (socketRef.current) {
            socketRef.current.emit('joinChat', fullChat._id)
          }
        })
      } else {
        // If not found in current chats, use the provided chat
        setSelectedChat(chat)
        requestAnimationFrame(() => {
          fetchMessages(chat._id)
          if (socketRef.current) {
            socketRef.current.emit('joinChat', chat._id)
          }
        })
      }
      return currentChats
    })
  }, [fetchMessages])

  // Fetch chats when user is authenticated
  useEffect(() => {
    if (!user) return
    
    const token = localStorage.getItem('token')
    if (!token) return

    fetchChats()
  }, [user, fetchChats])

  // Process chatId from URL when chats are loaded
  useEffect(() => {
    if (!user || chats.length === 0 || !chatIdFromUrlRef.current || hasProcessedUrlChatRef.current) {
      return
    }

    const chatId = chatIdFromUrlRef.current
    const chat = chats.find((c) => c._id === chatId)
    
    if (chat) {
      hasProcessedUrlChatRef.current = true
      openChat(chat)
      router.replace('/user')
      chatIdFromUrlRef.current = null
    } else {
      // Chat not found, try fetching chats again
      fetchChats().then((updatedChats) => {
        const updatedChat = updatedChats.find((c) => c._id === chatId)
        if (updatedChat && !hasProcessedUrlChatRef.current) {
          hasProcessedUrlChatRef.current = true
          openChat(updatedChat)
          router.replace('/user')
          chatIdFromUrlRef.current = null
        }
      })
    }
  }, [user, chats, router, openChat, fetchChats])

  // Effect for Socket.IO setup
  useEffect(() => {
    if (!user) return
    
    const token = localStorage.getItem('token')
    if (!token) return

    // Initialize Socket.IO
    socketRef.current = io('http://localhost:5000', {
      auth: { token },
    })

    socketRef.current.on('connect', () => {
      console.log('Connected to server')
      // Join all existing chats when connected
      if (chats.length > 0) {
        chats.forEach(chat => {
          if (chat._id) {
            socketRef.current?.emit('joinChat', chat._id)
          }
        })
      }
    })

    // Clean message handler using ref
    socketRef.current.on('message', (message: Message) => {
      const currentChat = selectedChatRef.current // Always get latest chat
      
      setMessages((prev) => {
        if (currentChat && message.chatId === currentChat._id) {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some(m => 
            m._id === message._id || 
            (!m._id && m.content === message.content && m.sender === message.sender)
          )
          
          if (!exists) {
            // Update selectedChat participants if this is a group chat
            if (currentChat.isGroupChat && message.senderName) {
              setSelectedChat((chat) => {
                if (!chat || !message.senderName) return chat
                return updateParticipantInfo(chat, message.sender, message.senderName)
              })
            }
            return [...prev, message]
          }
        }
        return prev
      })
    })

    // Clean messageSent handler using ref
    socketRef.current.on('messageSent', (message: Message) => {
      const currentChat = selectedChatRef.current // Always get latest chat
      
      setMessages((prev) => {
        if (currentChat && message.chatId === currentChat._id) {
          // Update selectedChat participants if this is a group chat
          if (currentChat.isGroupChat && message.senderName) {
            setSelectedChat((chat) => {
              if (!chat || !message.senderName) return chat
              return updateParticipantInfo(chat, message.sender, message.senderName)
            })
          }
          
          // Find and replace optimistic message (one without _id) with real message
          const optimisticIndex = prev.findIndex(m => 
            !m._id && 
            m.content === message.content && 
            m.sender === message.sender
          )
          
          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one
            const newMessages = [...prev]
            newMessages[optimisticIndex] = message
            return newMessages
          } else {
            // If no optimistic message found, just add it
            const exists = prev.some(m => m._id === message._id)
            if (!exists) {
              return [...prev, message]
            }
          }
        }
        return prev
      })
    })

    socketRef.current.on('typing', (data: { userId: string; isTyping: boolean }) => {
      const currentChat = selectedChatRef.current // Always get latest chat
      const currentUser = user // Capture user from closure
      
      // Only show typing if it's from the other user in current chat
      if (currentChat && currentUser) {
        const otherUserId = currentChat.participants.find(p => p._id !== currentUser.id)?._id
        if (data.userId === otherUserId) {
          setIsTyping(data.isTyping)
        }
      }
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

    socketRef.current.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [user, chats, updateParticipantInfo]) // Note: selectedChat NOT in deps - we use ref instead

  const handleChatSelect = (chat: Chat) => {
    openChat(chat)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentChat = selectedChatRef.current // Use ref to get latest chat
    if (!messageInput.trim() || !currentChat || !socketRef.current) return

    const messageContent = messageInput.trim()
    setMessageInput('')
    setIsTyping(false)

    // Ensure sender is in the chat room
    if (currentChat._id) {
      socketRef.current.emit('joinChat', currentChat._id)
    }

    // Optimistically add message to UI (without _id, will be replaced when server responds)
    const tempMessage: Message = {
      sender: user!.id,
      content: messageContent,
      timestamp: new Date(),
      chatId: currentChat._id,
    }

    setMessages((prev) => [...prev, tempMessage])

    // Send message via Socket.IO
    socketRef.current.emit('sendMessage', {
      chatId: currentChat._id,
      content: messageContent,
      sender: user!.id,
    })
  }

  const handleTyping = () => {
    const currentChat = selectedChatRef.current // Use ref to get latest chat
    if (!currentChat || !socketRef.current) return
    socketRef.current.emit('typing', {
      chatId: currentChat._id,
      isTyping: true,
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    router.push('/login')
  }

  // Show loading state until user is loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${themeClasses.bgPrimary}`}>
      <Sidebar user={user} onLogout={handleLogout} currentPage="chats" />

      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        currentUserId={user.id}
        onChatSelect={handleChatSelect}
        onlineUsers={onlineUsers}
      />

      <ConversationWindow
        selectedChat={selectedChat}
        messages={messages}
        currentUserId={user.id}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isTyping={isTyping}
        onlineUsers={onlineUsers}
      />
    </div>
  )
}
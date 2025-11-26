'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserInitials, getFullName } from '../utils/userUtils'
import { User } from '../types'
import { themeClasses, themeStyles, componentStyles } from '../utils/theme'

interface SidebarProps {
  user: User
  onLogoutCleanup? : () => void
  currentPage?: 'chats' | 'profile' | 'search' | 'groups'
}

export default function Sidebar({ user, onLogoutCleanup, currentPage = 'chats' }: SidebarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // If parent component provided additional cleanup (like socket disconnection)
    if (onLogoutCleanup) {
      onLogoutCleanup()
    }
    
    router.push('/login')
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    handleLogout()
  }

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  return (
    <>
      <div
        className={`relative transition-all duration-300 h-screen flex-shrink-0 ${
          expanded ? 'w-64' : 'w-16'
        } ${themeClasses.bgPrimary} ${themeClasses.textPrimary}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex flex-col h-full py-4">
          {/* Profile */}
          <div className="px-4 mb-6">
            <div className="flex items-center space-x-3">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={getFullName(user.firstName, user.lastName)}
                  className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${themeClasses.bgAccent}`}>
                  <span className="text-lg font-semibold text-white">
                    {getUserInitials(user.firstName, user.lastName)}
                  </span>
                </div>
              )}
              {expanded && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${themeClasses.textPrimary}`}>
                    {getFullName(user.firstName, user.lastName)}
                  </p>
                  <p className={`text-xs truncate ${themeClasses.textSecondary}`}>{user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2 px-2">
            <SidebarItem
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              label="Profile"
              expanded={expanded}
              active={currentPage === 'profile'}
              onClick={() => router.push('/user/profile')}
            />
            <SidebarItem
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              label="Search"
              expanded={expanded}
              active={currentPage === 'search'}
              onClick={() => router.push('/user/search')}
            />
            <SidebarItem
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              label="Chats"
              expanded={expanded}
              active={currentPage === 'chats'}
              onClick={() => router.push('/user')}
            />
            <SidebarItem
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              label="Group Chats"
              expanded={expanded}
              active={currentPage === 'groups'}
              onClick={() => router.push('/user/groups')}
            />
          </nav>

          {/* Logout */}
          <div className={`px-2 pt-4 border-t ${themeClasses.borderAccent}`}>
            <button
              onClick={handleLogoutClick}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${themeClasses.textPrimary} hover:opacity-80`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {expanded && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`${themeClasses.bgPrimary} rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}>
            <h3 className={`text-lg font-semibold mb-2 ${themeClasses.textPrimary}`}>
              Confirm Logout
            </h3>
            <p className={`mb-6 ${themeClasses.textSecondary}`}>
              Are you sure you want to logout? You'll need to login again to access your account.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelLogout}
                className={`px-4 py-2 rounded-lg transition ${themeClasses.textPrimary} hover:opacity-80 border ${themeClasses.borderAccent}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  expanded: boolean
  active?: boolean
  onClick?: () => void
}

function SidebarItem({ icon, label, expanded, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${themeClasses.textPrimary}`}
      style={active ? componentStyles.sidebarItem.active : {}}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = componentStyles.sidebarItem.hover.backgroundColor
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <div className="flex-shrink-0">{icon}</div>
      {expanded && <span className="text-sm">{label}</span>}
    </button>

    
  )
}
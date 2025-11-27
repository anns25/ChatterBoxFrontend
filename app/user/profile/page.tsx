'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Sidebar from '../../../components/Sidebar'
import { User } from '../../../types'
import { getUserInitials, getFullName } from '@/utils/userUtils'
import Image from 'next/image'
import { themeClasses, themeStyles, componentStyles } from '@/utils/theme'
import { getApiUrl } from '@/utils/config'

interface UserProfile {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  createdAt?: string
  lastLoginAt?: string
  profilePicture?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Load user from localStorage
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
      setFormData({
        firstName: parsedUser.firstName,
        lastName: parsedUser.lastName,
        email: parsedUser.email,
      })
    } catch {
      router.push('/login')
    }
  }, [router])

  // Fetch user profile
  useEffect(() => {
    if (!user?.id) return

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(getApiUrl(`api/users/${user.id}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProfile(response.data)
        
        // Only update user if profilePicture changed or is missing
        if (response.data.profilePicture !== user.profilePicture) {
          const updatedUser: User = {
            id: user.id,
            firstName: response.data.firstName || user.firstName,
            lastName: response.data.lastName || user.lastName,
            email: response.data.email || user.email,
            role: user.role,
            profilePicture: response.data.profilePicture || user.profilePicture,
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setUser(updatedUser)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user?.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
        const token = localStorage.getItem('token')
        if (!user) return
        
        const response = await axios.patch(
          getApiUrl('api/users/profile'),
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
  
        // Update localStorage with new user data
        const updatedUser: User = {
          id: user.id,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          role: user.role,
          profilePicture: response.data.profilePicture,
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setProfile(response.data)
        setIsEditing(false)
        setSuccess('Profile updated successfully!')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to update profile')
      } else {
        setError('Failed to update profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!passwordData.currentPassword) {
      setError('Current password is required')
      return
    }

    if (!passwordData.newPassword) {
      setError('New password is required')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from current password')
      return
    }
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        getApiUrl('api/users/password'),
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsChangingPassword(false)
      setSuccess('Password changed successfully!')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to change password')
      } else {
        setError('Failed to change password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '' }
    if (password.length < 8) return { strength: 1, label: 'Weak' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    
    const labels = ['Weak', 'Fair', 'Good', 'Strong']
    return { strength, label: labels[strength - 1] || 'Weak' }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (!user) {
    return (
      <div className={`flex items-center justify-center h-screen ${themeClasses.bgPrimary}`}>
        <div className={themeClasses.textSecondary}>Loading...</div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadProfilePicture = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement
    const file = fileInput?.files?.[0]
    
    if (!file) {
      setError('Please select an image file')
      return
    }

    setIsUploadingPicture(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('profilePicture', file)

      const response = await axios.post(
        getApiUrl('api/users/profile-picture'),
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // Update localStorage with new user data
      const updatedUser: User = {
        id: user!.id,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        role: user!.role,
        profilePicture: response.data.profilePicture,
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setProfile(response.data)
      setPreviewImage(null)
      setSuccess('Profile picture updated successfully!')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to upload profile picture')
      } else {
        setError('Failed to upload profile picture')
      }
    } finally {
      setIsUploadingPicture(false)
      // Reset file input
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }

  const handleDeleteProfilePicture = async () => {
    if (!user?.profilePicture) return

    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(
        getApiUrl('api/users/profile-picture'),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Update localStorage and state
      const updatedUser: User = {
        id: user.id,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        role: user.role,
        profilePicture: undefined, // Remove profilePicture
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setProfile(response.data)
      setSuccess('Profile picture removed successfully!')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to remove profile picture')
      } else {
        setError('Failed to remove profile picture')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex h-screen ${themeClasses.bgPrimary}`}>
      <Sidebar user={user} currentPage="profile" />

      <div className={`flex-1 flex flex-col overflow-y-auto ${themeClasses.bgSecondary}`}>
        {/* Header */}
        <div className={`p-6 border-b ${themeClasses.borderSecondary}`}>
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>My Profile</h1>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Manage your account information and settings
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className={`mx-6 mt-4 p-3 ${themeClasses.bgAccent} border ${themeClasses.borderAccent} rounded-lg ${themeClasses.textPrimary} text-sm`}>
            {success}
          </div>
        )}
        {error && (
          <div className={`mx-6 mt-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm`}>
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center flex-1 p-4 max-[540px]:p-3 md:p-6 space-y-4 max-[540px]:space-y-3 md:space-y-6 text-center max-[540px]:text-center">
          {/* Profile Picture Card */}
          <div className={`${themeClasses.card} rounded-lg p-4 max-[540px]:p-3 md:p-6 w-full`}>
            <div className="flex max-[540px]:flex-col max-[540px]:items-center items-center max-[540px]:justify-center justify-between mb-4 md:mb-6 gap-3">
              <h2 className={`text-base md:text-lg font-semibold ${themeClasses.textPrimary}`}>Profile Picture</h2>
              {user?.profilePicture && !previewImage && (
                <button
                  onClick={handleDeleteProfilePicture}
                  disabled={isLoading}
                  className={`px-4 py-2 max-[540px]:w-full bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                >
                  Remove Picture
                </button>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 max-[540px]:space-y-4 md:flex-row md:space-y-0 md:space-x-6">
              <div className="relative flex-shrink-0">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className={`w-24 h-24 max-[540px]:w-20 max-[540px]:h-20 md:w-32 md:h-32 rounded-full object-cover border-4 ${themeClasses.borderAccent}`}
                  />
                ) : user?.profilePicture ? (
                  <div className={`relative ${!previewImage ? "group" : ""}`}>
                    <img
                      src={user.profilePicture}
                      alt={getFullName(user.firstName, user.lastName)}
                      className={`w-24 h-24 max-[540px]:w-20 max-[540px]:h-20 md:w-32 md:h-32 rounded-full object-cover border-4 ${themeClasses.borderAccent}`}
                    />
                  </div>
                ) : (
                  <div className={`w-24 h-24 max-[540px]:w-20 max-[540px]:h-20 md:w-32 md:h-32 rounded-full ${themeClasses.bgAccent} flex items-center justify-center border-4 ${themeClasses.borderAccent}`}>
                    <span className="text-2xl max-[540px]:text-xl md:text-5xl font-semibold text-white">
                      {getUserInitials(user!.firstName, user!.lastName)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full min-w-0">
                <form onSubmit={handleUploadProfilePicture} className="space-y-3 md:space-y-4">
                  <div>
                    <input
                      id="profilePictureInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`block w-full text-xs md:text-sm ${themeClasses.textSecondary} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-semibold ${themeClasses.bgTertiary} ${themeClasses.textAccent} hover:${themeClasses.bgAccentHover}`}
                    />
                    <div className='flex max-[540px]:justify-center justify-between items-center'>
                    <label
                      htmlFor="profilePictureInput"
                      className={`block mt-1  text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                    >
                      Choose a new profile picture
                    </label>
                    <p className={`mt-1 text-xs max-[540px]:hidden ${themeClasses.textMuted}`}>
                      JPG, PNG, GIF or WEBP. Max size: 5MB
                    </p>
                    </div>
                  </div>

                  {previewImage && (
                    <div className="flex flex-col max-[540px]:items-center space-x-3 max-[540px]:space-x-0 max-[540px]:space-y-2 md:flex-row">
                      <button
                        type="submit"
                        disabled={isUploadingPicture}
                        className={`w-full max-[540px]:max-w-xs px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                      >
                        {isUploadingPicture ? 'Uploading...' : 'Upload Picture'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null)
                          const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement
                          if (fileInput) fileInput.value = ''
                        }}
                        className={`w-full max-[540px]:max-w-xs px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className={`${themeClasses.card} rounded-lg p-4 max-[540px]:p-3 md:p-6 w-full`}>
            <div className="flex max-[540px]:flex-col max-[540px]:items-center items-center max-[540px]:justify-center justify-between mb-4 md:mb-6 gap-3">
              <h2 className={`text-base md:text-lg font-semibold ${themeClasses.textPrimary}`}>Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`max-[540px]:w-full px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium text-sm`}
                  //className={`px-4 py-2 max-[540px]:w-full bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                <div>
                  <label className={`block text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 md:px-4 py-2 text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 md:px-4 py-2 text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 md:px-4 py-2 text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent}`}
                  />
                </div>

                <div className="flex flex-col max-[540px]:items-center space-x-3 max-[540px]:space-x-0 max-[540px]:space-y-2 md:flex-row">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`max-[540px]:w-full px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                      })
                      setError('')
                    }}
                    className={`max-[540px]:w-full px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col max-[540px]:items-center items-center md:justify-around space-x-4 max-[540px]:space-x-0 max-[540px]:space-y-3 md:flex-row">
                {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={getFullName(user.firstName, user.lastName)}
                      className="w-16 h-16 max-[540px]:w-14 max-[540px]:h-14 md:w-20 md:h-20 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-16 h-16 max-[540px]:w-14 max-[540px]:h-14 md:w-20 md:h-20 rounded-full ${themeClasses.bgAccent} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xl max-[540px]:text-lg md:text-3xl font-semibold text-white">
                        {getUserInitials(user.firstName, user.lastName)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className={`text-lg max-[540px]:text-base md:text-xl font-semibold  ${themeClasses.textPrimary}`}>{getFullName(user.firstName, user.lastName)}</h3>
                    <p className={`text-sm max-[540px]:text-xs md:text-base ${themeClasses.textSecondary}`}>{user.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium ${themeClasses.bgAccent} ${themeClasses.textPrimary} rounded`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className={`grid grid-cols-1 max-[540px]:justify-items-center md:grid-cols-2 gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t ${themeClasses.borderSecondary}`}>
                  <div>
                    <p className={`text-xs md:text-sm ${themeClasses.textMuted}`}>Account Created</p>
                    <p className={`text-sm max-[540px]:text-xs md:text-base font-medium ${themeClasses.textPrimary}`}>
                      {formatDate(profile?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs md:text-sm ${themeClasses.textMuted}`}>Last Login</p>
                    <p className={`text-sm max-[540px]:text-xs md:text-base font-medium ${themeClasses.textPrimary}`}>
                      {formatDate(profile?.lastLoginAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Card */}
          <div className={`${themeClasses.card} rounded-lg p-4 max-[540px]:p-3 md:p-6 w-full`}>
            <div className="flex max-[540px]:flex-col max-[540px]:items-center items-center max-[540px]:justify-center justify-between mb-4 md:mb-6 gap-3">
              <h2 className={`text-base md:text-lg font-semibold ${themeClasses.textPrimary}`}>Change Password</h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className={`max-[540px]:w-full px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} className="space-y-4 text-left">
                <div>
                  <label className={`block text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className={`w-full px-3 md:px-4 py-2 text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    className={`w-full px-3 md:px-4 py-2 text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent}`}
                  />
                  {passwordData.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className={`flex-1 ${themeClasses.bgTertiary} rounded-full h-2`}>
                          <div
                            className={`h-2 rounded-full transition-all ${
                              getPasswordStrength(passwordData.newPassword).strength === 1
                                ? 'bg-red-500 w-1/4'
                                : getPasswordStrength(passwordData.newPassword).strength === 2
                                ? 'bg-yellow-500 w-2/4'
                                : getPasswordStrength(passwordData.newPassword).strength === 3
                                ? `${themeClasses.bgAccent} w-3/4`
                                : getPasswordStrength(passwordData.newPassword).strength === 4
                                ? 'bg-green-500 w-full'
                                : ''
                            }`}
                          ></div>
                        </div>
                        <span className={`text-xs ${themeClasses.textSecondary}`}>
                          {getPasswordStrength(passwordData.newPassword).label}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className={`mt-1 text-xs ${themeClasses.textMuted}`}>
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <label className={`block text-xs md:text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    className={`w-full px-3 md:px-4 py-2 text-sm md:text-base ${themeClasses.bgTertiary} ${themeClasses.borderSecondary} border rounded-lg focus:outline-none focus:ring-2 ${themeClasses.textPrimary} focus:${themeClasses.borderAccent}`}
                  />
                </div>

                <div className="flex flex-col max-[540px]:items-center space-x-3 max-[540px]:space-x-0 max-[540px]:space-y-2 md:flex-row">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`max-[540px]:w-full px-4 py-2 ${themeClasses.btnPrimary} rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setError('')
                    }}
                    className={`max-[540px]:w-full px-4 py-2 ${themeClasses.btnSecondary} rounded-lg transition font-medium text-sm`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
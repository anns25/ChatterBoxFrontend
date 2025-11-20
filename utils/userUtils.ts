export const getUserInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || ''
    const lastInitial = lastName?.charAt(0).toUpperCase() || ''
    return `${firstInitial}${lastInitial}` || '?'
  }
  
  export const getFullName = (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`.trim()
  }
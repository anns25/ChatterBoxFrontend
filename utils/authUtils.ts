import { useRouter } from 'next/navigation'

export const logout = (router: ReturnType<typeof useRouter>, additionalCleanup?: () => void) => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  // Run any additional cleanup (like socket disconnection)
  if (additionalCleanup) {
    additionalCleanup()
  }
  
  router.push('/login')
}
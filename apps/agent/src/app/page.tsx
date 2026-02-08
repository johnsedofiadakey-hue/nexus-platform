'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AgentHomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirect authenticated agents to mobile POS
      router.push('/mobilepos')
    } else if (status === 'unauthenticated') {
      // Redirect unauthenticated users to login
      router.push('/auth/login')
    }
  }, [status, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading Nexus Agent Portal...</h2>
      </div>
    </div>
  )
}

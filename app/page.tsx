"use client"

import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { AdminHome } from "@/components/home/AdminHome"
import { EditorHome } from "@/components/home/EditorHome"
import { SuperadminHome } from "@/components/home/SuperadminHome"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <Sidebar />

      <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
        {user.role_slug === 'superadmin' && <SuperadminHome user={user} />}
        {user.role_slug === 'admin' && <AdminHome user={user} />}
        {user.role_slug === 'editor' && <EditorHome user={user} />}
      </main>
    </div>
  )
}

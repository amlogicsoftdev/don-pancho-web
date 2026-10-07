'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'

export function LogoutButton() {
  const router = useRouter()

  async function salir() {
    await authClient.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <Button size="sm" onClick={salir}>
      <LogOut />
      Salir
    </Button>
  )
}

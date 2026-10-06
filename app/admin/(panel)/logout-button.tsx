'use client'

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
    <Button variant="outline" size="sm" onClick={salir}>
      Salir
    </Button>
  )
}

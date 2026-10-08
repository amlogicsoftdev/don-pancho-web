'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'

/** Botón para cerrar la sesión: discreto en la barra; al pasar el mouse se tiñe de rojo. */
export function LogoutButton() {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await authClient.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <button type="button" className="pn-salir" onClick={salir} disabled={saliendo}>
      <LogOut className="pn-salir__icono" aria-hidden="true" />
      {saliendo ? 'Saliendo…' : 'Salir'}
    </button>
  )
}

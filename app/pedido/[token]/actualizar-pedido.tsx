'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ActualizarPedidoProps {
  /** Solo se consulta mientras el pedido sigue en curso. */
  activo: boolean
  segundos: number
}

/** Vuelve a pedir la página cada tantos segundos (y al volver a la pestaña) para mostrar el estado nuevo. */
export function ActualizarPedido({ activo, segundos }: ActualizarPedidoProps) {
  const router = useRouter()

  useEffect(() => {
    if (!activo) return

    const actualizar = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const intervalo = setInterval(actualizar, segundos * 1000)
    document.addEventListener('visibilitychange', actualizar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
    }
  }, [activo, segundos, router])

  return null
}

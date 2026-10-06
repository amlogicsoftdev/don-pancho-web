'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const CADA_MS = 15_000

interface Resumen {
  pendientes: number
  ultimoId: number
}

// Pitido corto con la Web Audio API (sin archivos). Los navegadores lo bloquean hasta que la
// persona interactúa con la página; si falla, el aviso visual igual aparece.
function pitar() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
    osc.onended = () => void ctx.close()
  } catch {
    // Sin sonido.
  }
}

/** Enlace a Pedidos con el contador de pendientes; avisa y refresca cuando entra un pedido nuevo. */
export function AvisoPedidos({ pendientesIniciales }: { pendientesIniciales: number }) {
  const router = useRouter()
  const [pendientes, setPendientes] = useState(pendientesIniciales)
  const [hayNuevo, setHayNuevo] = useState(false)
  const ultimoVisto = useRef<number | null>(null)

  useEffect(() => {
    let activo = true

    async function consultar() {
      try {
        const respuesta = await fetch('/api/admin/pedidos/resumen', { cache: 'no-store' })
        if (!respuesta.ok) return
        const datos: Resumen = await respuesta.json()
        if (!activo) return

        setPendientes(datos.pendientes)
        if (ultimoVisto.current !== null && datos.ultimoId > ultimoVisto.current) {
          setHayNuevo(true)
          pitar()
          router.refresh()
        }
        ultimoVisto.current = datos.ultimoId
      } catch {
        // Sin conexión: se reintenta en el próximo ciclo.
      }
    }

    void consultar()
    const intervalo = setInterval(consultar, CADA_MS)
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [router])

  return (
    <Link
      href="/admin/pedidos"
      onClick={() => setHayNuevo(false)}
      className="relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/5"
    >
      Pedidos
      {pendientes > 0 && (
        <span
          className={`rounded-full bg-cheesy-yellow px-2 py-0.5 text-xs font-bold text-cheesy-black ${hayNuevo ? 'animate-pulse' : ''}`}
          aria-label={`${pendientes} pedidos pendientes`}
        >
          {pendientes}
        </span>
      )}
      {hayNuevo && <span role="status" className="sr-only">Entró un pedido nuevo</span>}
    </Link>
  )
}

'use client'

import { BellRing } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const CADA_MS = 15_000
// Mientras haya pedidos pendientes, el timbre vuelve a sonar cada minuto. Se consulta cada 15 s:
// el margen evita que por unos milisegundos de demora se espere una vuelta más.
const RECORDATORIO_MS = 60_000 - 2_000

interface Resumen {
  pendientes: number
  ultimoId: number
}

// Timbre "din-don" con la Web Audio API (sin archivos). Los navegadores no dejan sonar nada
// hasta que la persona toca la página: el audio se habilita con el primer clic o tecla. Si no
// se puede, el aviso visual igual aparece.
let contexto: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    contexto ??= new AudioContext()
    return contexto
  } catch {
    return null
  }
}

/** Una nota de campana: golpe rápido y apagado largo, con un armónico que le da el metal. */
function nota(ctx: AudioContext, frecuencia: number, inicio: number) {
  const volumen = ctx.createGain()
  volumen.gain.setValueAtTime(0.0001, inicio)
  volumen.gain.exponentialRampToValueAtTime(0.3, inicio + 0.01)
  volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.4)
  volumen.connect(ctx.destination)

  for (const [multiplo, peso] of [
    [1, 1],
    [2.76, 0.18],
  ] as const) {
    const osc = ctx.createOscillator()
    const parcial = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frecuencia * multiplo
    parcial.gain.value = peso
    osc.connect(parcial)
    parcial.connect(volumen)
    osc.start(inicio)
    osc.stop(inicio + 1.5)
  }
}

function sonarTimbre() {
  const ctx = audio()
  // Si el navegador todavía no habilitó el audio, no se encola nada (sonaría todo junto después)
  if (!ctx || ctx.state !== 'running') return
  const ahora = ctx.currentTime + 0.02
  nota(ctx, 659.25, ahora) // mi
  nota(ctx, 523.25, ahora + 0.45) // do
}

/** Enlace a Pedidos con el contador de pendientes; avisa y refresca cuando entra un pedido nuevo. */
export function AvisoPedidos({ pendientesIniciales, activo }: { pendientesIniciales: number; activo: boolean }) {
  const router = useRouter()
  const [pendientes, setPendientes] = useState(pendientesIniciales)
  const [hayNuevo, setHayNuevo] = useState(false)
  const ultimoVisto = useRef<number | null>(null)
  // Cuándo sonó el timbre por última vez (0: no hay pendientes, no se cuenta)
  const ultimoTimbre = useRef(0)

  // El audio se habilita con el primer toque en la página (regla de los navegadores)
  useEffect(() => {
    const habilitar = () => void audio()?.resume()
    window.addEventListener('pointerdown', habilitar)
    window.addEventListener('keydown', habilitar)
    return () => {
      window.removeEventListener('pointerdown', habilitar)
      window.removeEventListener('keydown', habilitar)
    }
  }, [])

  useEffect(() => {
    let activo = true

    async function consultar() {
      try {
        const respuesta = await fetch('/api/admin/pedidos/resumen', { cache: 'no-store' })
        if (!respuesta.ok) return
        const datos: Resumen = await respuesta.json()
        if (!activo) return

        setPendientes(datos.pendientes)
        const ahora = Date.now()
        if (ultimoVisto.current !== null && datos.ultimoId > ultimoVisto.current) {
          // Entró un pedido nuevo: timbre, y el recordatorio cuenta desde acá
          setHayNuevo(true)
          sonarTimbre()
          ultimoTimbre.current = ahora
          router.refresh()
        } else if (datos.pendientes === 0) {
          ultimoTimbre.current = 0
        } else if (ultimoTimbre.current === 0) {
          // Hay pendientes de antes (por ejemplo, al abrir el panel): el recordatorio arranca a contar
          ultimoTimbre.current = ahora
        } else if (ahora - ultimoTimbre.current >= RECORDATORIO_MS) {
          sonarTimbre()
          ultimoTimbre.current = ahora
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
      className="pn-nav-link"
      aria-current={activo ? 'page' : undefined}
    >
      Pedidos
      {pendientes > 0 && (
        <span
          className="pn-aviso"
          data-nuevo={hayNuevo}
          aria-label={pendientes === 1 ? '1 pedido pendiente' : `${pendientes} pedidos pendientes`}
        >
          <BellRing className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
          {pendientes}
        </span>
      )}
      {hayNuevo && <span role="status" className="sr-only">Entró un pedido nuevo</span>}
    </Link>
  )
}

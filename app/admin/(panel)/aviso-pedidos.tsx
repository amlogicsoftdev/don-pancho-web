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

// Campanilla de mostrador ("¡ding, ding!", la de recepción o la de "¡pedido!" en la cocina),
// hecha con la Web Audio API (sin archivos). Los navegadores no dejan sonar nada hasta que la
// persona toca la página: el audio se habilita con el primer clic o tecla. Si no se puede, el
// aviso visual igual aparece.
let contexto: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    contexto ??= new AudioContext()
    return contexto
  } catch {
    return null
  }
}

// Una campanilla no es una nota pura: suenan varios parciales que no son múltiplos exactos de la
// fundamental (eso le da el metal), y los agudos se apagan antes que el grave.
const FUNDAMENTAL = 1320
const PARCIALES = [
  { multiplo: 1, volumen: 1, dura: 1.8 },
  { multiplo: 2.42, volumen: 0.45, dura: 0.9 },
  { multiplo: 3.9, volumen: 0.2, dura: 0.5 },
  { multiplo: 5.4, volumen: 0.1, dura: 0.3 },
]

/** Un golpe de campanilla: el "tic" del martillo y el metal que queda sonando. */
function golpe(ctx: AudioContext, salida: AudioNode, inicio: number) {
  for (const p of PARCIALES) {
    const osc = ctx.createOscillator()
    const volumen = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = FUNDAMENTAL * p.multiplo
    volumen.gain.setValueAtTime(0.0001, inicio)
    volumen.gain.exponentialRampToValueAtTime(p.volumen, inicio + 0.003)
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + p.dura)
    osc.connect(volumen)
    volumen.connect(salida)
    osc.start(inicio)
    osc.stop(inicio + p.dura + 0.05)
  }

  // El "tic": ruido muy corto y agudo
  const muestras = Math.floor(ctx.sampleRate * 0.012)
  const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate)
  const datos = buffer.getChannelData(0)
  for (let i = 0; i < muestras; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras)
  const ruido = ctx.createBufferSource()
  const agudos = ctx.createBiquadFilter()
  const volumenRuido = ctx.createGain()
  ruido.buffer = buffer
  agudos.type = 'highpass'
  agudos.frequency.value = 3000
  volumenRuido.gain.value = 0.25
  ruido.connect(agudos)
  agudos.connect(volumenRuido)
  volumenRuido.connect(salida)
  ruido.start(inicio)
}

function sonarTimbre() {
  const ctx = audio()
  // Si el navegador todavía no habilitó el audio, no se encola nada (sonaría todo junto después)
  if (!ctx || ctx.state !== 'running') return
  const salida = ctx.createGain()
  salida.gain.value = 0.28
  salida.connect(ctx.destination)
  const ahora = ctx.currentTime + 0.02
  // Dos golpes, como cuando se toca la campanilla del mostrador
  golpe(ctx, salida, ahora)
  golpe(ctx, salida, ahora + 0.3)
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

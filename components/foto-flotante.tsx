'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/lib/types'

// Separación entre el puntero y la foto, y tamaño de la foto (w-45 + el pie de la polaroid)
const SEPARACION = 28
const ANCHO = 180
const ALTO = 222
const MARGEN = 12
// Cuánto se acerca la foto al puntero en cada cuadro (0–1): menos es más "flotante"
const SEGUIMIENTO = 0.16
// Giro de base y cuánto se inclina según la velocidad, como si colgara del puntero
const GIRO_BASE = -4
const INCLINACION = 0.55
const GIRO_MAX = 10

/**
 * Polaroid con la foto del plato que sigue al mouse sobre la carta (solo con mouse).
 * Va detrás del puntero con un poco de retraso, se inclina hacia donde se mueve y entra y sale
 * con un fundido; al pasar de un plato a otro cambia la foto sin desaparecer.
 */
export function FotoFlotante({ producto }: { producto: Product | null }) {
  // El último plato se sigue mostrando mientras la foto se desvanece
  const [ultimo, setUltimo] = useState(producto)
  if (producto && producto !== ultimo) setUltimo(producto)

  const posicion = useRef<HTMLDivElement>(null)
  const giro = useRef<HTMLDivElement>(null)
  const estado = useRef({ x: 0, y: 0, objetivoX: 0, objetivoY: 0, inclinacion: 0, cuadro: 0, visible: false })

  useEffect(() => {
    const e = estado.current
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const objetivo = (punteroX: number, punteroY: number) => {
      // A la derecha del puntero; si no entra, a la izquierda. Siempre dentro de la pantalla.
      const derecha = punteroX + SEPARACION
      e.objetivoX = derecha + ANCHO + MARGEN > window.innerWidth ? punteroX - SEPARACION - ANCHO : derecha
      e.objetivoY = Math.min(Math.max(punteroY - ALTO / 2, MARGEN), window.innerHeight - ALTO - MARGEN)
    }

    const dibujar = () => {
      e.cuadro = 0
      // Al dejar de verse se queda donde está y se desvanece ahí
      if (!e.visible) return
      const factor = quieto ? 1 : SEGUIMIENTO
      const dx = (e.objetivoX - e.x) * factor
      e.x += dx
      e.y += (e.objetivoY - e.y) * factor
      const inclinacion = quieto ? 0 : Math.max(-GIRO_MAX, Math.min(GIRO_MAX, dx * INCLINACION))
      e.inclinacion += (inclinacion - e.inclinacion) * 0.2
      if (posicion.current) posicion.current.style.transform = `translate3d(${e.x}px, ${e.y}px, 0)`
      if (giro.current) giro.current.style.transform = `rotate(${GIRO_BASE + e.inclinacion}deg)`
      // Sigue mientras se esté moviendo; quieta, no gasta nada
      const enMovimiento = Math.abs(e.objetivoX - e.x) + Math.abs(e.objetivoY - e.y) > 0.3 || Math.abs(e.inclinacion) > 0.05
      if (enMovimiento) e.cuadro = requestAnimationFrame(dibujar)
    }

    const alMover = (ev: MouseEvent) => {
      objetivo(ev.clientX, ev.clientY)
      // Mientras no se ve (o se está desvaneciendo) se queda quieta: se apaga en su lugar
      if (e.visible && !e.cuadro) e.cuadro = requestAnimationFrame(dibujar)
    }

    window.addEventListener('mousemove', alMover, { passive: true })
    return () => {
      window.removeEventListener('mousemove', alMover)
      cancelAnimationFrame(e.cuadro)
    }
  }, [])

  // Al aparecer, la foto arranca justo al lado del puntero (no viaja desde donde quedó)
  useLayoutEffect(() => {
    const e = estado.current
    const visible = producto !== null
    if (visible && !e.visible) {
      e.x = e.objetivoX
      e.y = e.objetivoY
      e.inclinacion = 0
      if (posicion.current) posicion.current.style.transform = `translate3d(${e.x}px, ${e.y}px, 0)`
      if (giro.current) giro.current.style.transform = `rotate(${GIRO_BASE}deg)`
    }
    e.visible = visible
  }, [producto])

  // El contenedor está siempre, así ya tiene su posición cuando aparece la primera foto
  return (
    <div
      ref={posicion}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-40 hidden will-change-transform [@media(hover:hover)]:block"
    >
      <div ref={giro} style={{ transform: `rotate(${GIRO_BASE}deg)` }}>
        {ultimo && (
          <div className="foto-flotante" data-visible={producto !== null}>
            <div className="absolute -top-2.5 left-1/2 -ml-8 h-5 w-16 rotate-3 bg-[rgba(230,215,185,0.9)]" />
            {/* La key hace que, al cambiar de plato, la foto nueva entre con su fundido */}
            <div key={ultimo.id} className="foto-flotante__foto relative aspect-square w-full overflow-hidden bg-neutral-900">
              <Image src={ultimo.image} alt="" fill sizes="180px" className="object-cover" />
            </div>
            <span className="absolute inset-x-0 bottom-2 truncate px-2 text-center font-heading text-[13px] uppercase leading-none text-pancho-black">
              {ultimo.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

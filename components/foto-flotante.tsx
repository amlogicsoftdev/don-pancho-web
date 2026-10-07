'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/lib/types'

// Tamaño de la polaroid (w-45 más el pie) y separaciones
const ANCHO = 180
const ALTO = 222
const SEPARACION = 20
const MARGEN = 8
// Arriba del plato, cuánto se apoya sobre la fila (como pegada con la cinta)
const APOYO = 14
// Arriba del plato va más chica, para tapar solo la zona del precio de la fila de arriba
const ESCALA_ARRIBA = 0.7
// Cuánto se acerca a su lugar en cada cuadro (0–1): menos es más suave
const SEGUIMIENTO = 0.14

interface Lugar {
  x: number
  y: number
  giro: number
  escala: number
}

/**
 * Lugar de la foto para un plato, en coordenadas de la página. Si al costado de la carta hay
 * lugar (pantallas anchas), va pegada al costado de afuera, a la altura del plato. Si no, va
 * arriba del plato, del lado del precio: tapa un poco la fila de arriba, nunca la que se lee.
 * Si arriba no entra (justo debajo de los filtros), va abajo.
 */
function lugarPara(fila: HTMLElement, id: number): Lugar {
  const r = fila.getBoundingClientRect()
  const sx = window.scrollX
  const sy = window.scrollY
  // Cada plato con su propia inclinación, para que no se vean todas iguales
  const giro = id % 2 === 0 ? -4 : 3

  const aLaIzquierda = r.left + r.width / 2 < window.innerWidth / 2
  const libre = aLaIzquierda ? r.left : window.innerWidth - r.right
  if (libre >= ANCHO + SEPARACION + MARGEN) {
    return {
      x: sx + (aLaIzquierda ? r.left - SEPARACION - ANCHO : r.right + SEPARACION),
      y: sy + r.top + r.height / 2 - ALTO / 2,
      giro,
      escala: 1,
    }
  }

  const ancho = ANCHO * ESCALA_ARRIBA
  const alto = ALTO * ESCALA_ARRIBA
  const filtros = document.querySelector('.menu-filtros')?.getBoundingClientRect().bottom ?? 0
  const arriba = r.top - alto + APOYO
  return {
    x: sx + Math.max(MARGEN, r.right - ancho - 4),
    y: sy + (arriba >= filtros + MARGEN ? arriba : r.bottom - APOYO),
    giro,
    escala: ESCALA_ARRIBA,
  }
}

/**
 * Polaroid con la foto del plato que señala el mouse en la carta (solo con mouse). Queda
 * pegada al plato y, al pasar a otro, se desliza hasta él; entra con un pequeño rebote y se
 * apaga en su lugar. Al cambiar de plato, la foto cambia con un fundido.
 */
export function FotoFlotante({ producto, ancla }: { producto: Product | null; ancla: HTMLElement | null }) {
  // El último plato se sigue mostrando mientras la foto se desvanece
  const [ultimo, setUltimo] = useState(producto)
  if (producto && producto !== ultimo) setUltimo(producto)

  const caja = useRef<HTMLDivElement>(null)
  const estado = useRef({ x: 0, y: 0, giro: 0, escala: 1, destino: { x: 0, y: 0, giro: 0, escala: 1 }, cuadro: 0, visible: false })

  useEffect(() => {
    const e = estado.current
    return () => cancelAnimationFrame(e.cuadro)
  }, [])

  // Cada vez que cambia el plato, la foto va hacia su lugar nuevo
  useLayoutEffect(() => {
    const e = estado.current
    const visible = producto !== null && ancla !== null
    const aplicar = () => {
      if (caja.current) caja.current.style.transform = `translate3d(${e.x}px, ${e.y}px, 0) rotate(${e.giro}deg) scale(${e.escala})`
    }

    if (visible) {
      e.destino = lugarPara(ancla, producto.id)
      const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!e.visible || quieto) {
        // Al aparecer, arranca ya en su lugar (no viaja desde donde quedó la anterior)
        e.x = e.destino.x
        e.y = e.destino.y
        e.giro = e.destino.giro
        e.escala = e.destino.escala
        aplicar()
      } else {
        const dibujar = () => {
          e.x += (e.destino.x - e.x) * SEGUIMIENTO
          e.y += (e.destino.y - e.y) * SEGUIMIENTO
          e.giro += (e.destino.giro - e.giro) * SEGUIMIENTO
          e.escala += (e.destino.escala - e.escala) * SEGUIMIENTO
          aplicar()
          const falta =
            Math.abs(e.destino.x - e.x) + Math.abs(e.destino.y - e.y) + Math.abs(e.destino.giro - e.giro) + Math.abs(e.destino.escala - e.escala) * 100
          e.cuadro = falta > 0.3 ? requestAnimationFrame(dibujar) : 0
        }
        cancelAnimationFrame(e.cuadro)
        e.cuadro = requestAnimationFrame(dibujar)
      }
    }
    e.visible = visible
  }, [producto, ancla])

  // El contenedor está siempre, así ya tiene su posición cuando aparece la primera foto
  return (
    <div
      ref={caja}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-30 hidden origin-top-left will-change-transform [@media(hover:hover)]:block"
    >
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
  )
}

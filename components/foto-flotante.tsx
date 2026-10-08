'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/lib/types'

// Tamaño de la foto (cuadrada, w-45) y separaciones
const ANCHO = 180
const ALTO = 180
const SEPARACION = 20
const MARGEN = 8
// Lo más chica que puede quedar la foto cuando el margen de la pantalla es angosto
const ESCALA_MIN = 0.6
// Cuánto se acerca a su lugar en cada cuadro (0–1): menos es más suave
const SEGUIMIENTO = 0.14

interface Lugar {
  x: number
  y: number
  giro: number
  escala: number
}

/**
 * Lugar de la foto para un plato, en coordenadas de la página. Siempre va al costado de afuera,
 * a la altura del plato: los de la columna izquierda a la izquierda de los nombres, los de la
 * derecha a la derecha del «+», y los combos (`data-foto="derecha"`) a la derecha del cartel
 * rojo. Si el margen de la pantalla es angosto, la foto se achica para entrar (hasta ESCALA_MIN);
 * si ni así entra, se pega al borde de la ventana.
 */
function lugarPara(fila: HTMLElement, id: number): Lugar {
  const r = fila.getBoundingClientRect()
  const sx = window.scrollX
  const sy = window.scrollY
  // Cada plato con su propia inclinación, para que no se vean todas iguales
  const giro = id % 2 === 0 ? -4 : 3

  const aLaIzquierda = fila.dataset.foto !== 'derecha' && r.left + r.width / 2 < window.innerWidth / 2
  const libre = aLaIzquierda ? r.left : window.innerWidth - r.right
  const escala = Math.min(1, Math.max(ESCALA_MIN, (libre - SEPARACION - MARGEN) / ANCHO))
  const ancho = ANCHO * escala

  const x = aLaIzquierda ? r.left - SEPARACION - ancho : r.right + SEPARACION
  return {
    x: sx + Math.min(Math.max(MARGEN, x), window.innerWidth - ancho - MARGEN),
    y: sy + r.top + r.height / 2 - (ALTO * escala) / 2,
    giro,
    escala,
  }
}

/**
 * Foto del plato que señala el mouse en la carta (solo con mouse). Queda
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
          {/* La key hace que, al cambiar de plato, la foto nueva entre con su fundido */}
          <div key={ultimo.id} className="foto-flotante__foto relative aspect-square w-full overflow-hidden bg-neutral-900">
            <Image src={ultimo.image} alt="" fill sizes="180px" className="object-cover" />
          </div>
        </div>
      )}
    </div>
  )
}

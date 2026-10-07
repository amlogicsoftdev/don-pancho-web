'use client'

import React, { useEffect, useRef } from 'react'

const WORDS = ['Hamburguesas', 'Panchos', 'Delivery', 'Retiro en el local', 'Pedí por la web', 'Combos']

/** Velocidad de la cinta cuando la página está quieta, en píxeles por segundo. */
const BASE_SPEED = 70

/**
 * Cinta bordó con las palabras de la marca pasando sin parar, como una tira de afiches.
 * Una palabra de cada dos va en etiqueta blanca recta.
 *
 * La lista se repite dos veces seguidas y la tira se desplaza la mitad de su ancho:
 * así el final empalma con el principio. La segunda copia va oculta para lectores
 * de pantalla.
 *
 * La cinta acompaña al scroll: se acelera en el sentido en que se mueve la página,
 * se inclina un poco y cambia de dirección si se scrollea hacia arriba. Solo se mueve
 * mientras está en pantalla. Sin JavaScript corre sola con la animación de
 * app/globals.css («Cinta de texto en movimiento»); con «reducir movimiento» queda quieta.
 */
export function MarqueeBand() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId: number | null = null
    let offset = 0
    let direction = 1
    let boost = 0
    let lastTime = 0
    let lastScroll = window.scrollY
    let half = track.scrollWidth / 2

    const frame = (time: number) => {
      // Cuadros muy espaciados (pestaña en segundo plano) no deben dar un salto
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0
      lastTime = time

      const scrollY = window.scrollY
      const scrollSpeed = dt > 0 ? (scrollY - lastScroll) / dt : 0
      lastScroll = scrollY

      if (scrollSpeed > 40) direction = 1
      else if (scrollSpeed < -40) direction = -1

      // El empuje del scroll entra de a poco y se va de a poco
      boost += (scrollSpeed * 0.35 - boost) * Math.min(1, dt * 6)

      offset += (BASE_SPEED * direction + boost) * dt
      if (half > 0) offset = ((offset % half) + half) % half

      const skew = Math.max(-7, Math.min(7, boost * -0.012))
      track.style.transform = `translate3d(${(-offset).toFixed(1)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`

      rafId = requestAnimationFrame(frame)
    }

    const start = () => {
      if (rafId !== null) return
      lastTime = 0
      lastScroll = window.scrollY
      rafId = requestAnimationFrame(frame)
    }

    const stop = () => {
      if (rafId === null) return
      cancelAnimationFrame(rafId)
      rafId = null
    }

    const handleResize = () => {
      half = track.scrollWidth / 2
    }

    // Desde acá manda el componente: se apaga la animación de respaldo
    track.dataset.driven = 'true'

    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      rootMargin: '80px 0px',
    })
    observer.observe(track)
    window.addEventListener('resize', handleResize)

    return () => {
      stop()
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      delete track.dataset.driven
      track.style.transform = ''
    }
  }, [])

  const group = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {WORDS.map((word, index) => (
        <li key={word} className="flex items-center px-4 sm:px-6">
          <span
            className={
              index % 2 === 1
                ? '-rotate-2 bg-pancho-white px-2.5 py-0.5 text-pancho-red-deep sm:px-3'
                : 'text-pancho-cream'
            }
          >
            {word}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="marquee relative z-10 overflow-hidden bg-pancho-red-deep bg-[url('/images/fondo-papel-bordo.webp')] bg-cover bg-center py-3 font-display text-3xl leading-none whitespace-nowrap select-none sm:py-4 sm:text-5xl">
      <div ref={trackRef} className="marquee-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { PanchoButton } from './pancho-button'
import { SplitLines } from './split-lines'

/**
 * Primera pantalla. Al cargar, todo entra en orden: la banda roja desde el borde,
 * la etiqueta que se pega, el titular línea por línea, el texto, el botón y la
 * hamburguesa que cae girada (las entradas están en app/globals.css y corren sin JavaScript).
 *
 * Después de la entrada, dos movimientos mantienen viva la pantalla:
 * - la hamburguesa sigue apenas al mouse, en sentido contrario;
 * - al scrollear, el texto se va quedando atrás y se apaga mientras la hamburguesa viaja.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const text = textRef.current
    if (!section || !text) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // La hamburguesa fija del hueco y la que viaja: las dos siguen al mouse
    const stage = section.closest<HTMLElement>('.intro-stage') ?? section
    const burgers = Array.from(stage.querySelectorAll<HTMLElement>('[data-hero-parallax]'))

    let rafId: number | null = null
    let pointerX = 0
    let pointerY = 0
    let heroHeight = section.offsetHeight || 1

    const update = () => {
      rafId = null
      const scrollY = window.scrollY

      // El texto baja más lento que la página y se apaga antes de que el hero termine de salir
      if (scrollY < heroHeight) {
        text.style.transform = `translate3d(0, ${(scrollY * 0.22).toFixed(1)}px, 0)`
        text.style.opacity = Math.max(0, 1 - scrollY / (heroHeight * 0.65)).toFixed(3)
      }

      // Apenas empieza el scroll la hamburguesa deja de seguir al mouse: manda el viaje
      const follow = Math.max(0, 1 - scrollY / 120)
      const x = (pointerX * -18 * follow).toFixed(1)
      const y = (pointerY * -12 * follow).toFixed(1)
      for (const burger of burgers) burger.style.translate = `${x}px ${y}px`
    }

    const requestUpdate = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointerX = event.clientX / window.innerWidth - 0.5
      pointerY = event.clientY / window.innerHeight - 0.5
      requestUpdate()
    }

    const handlePointerLeave = () => {
      pointerX = 0
      pointerY = 0
      requestUpdate()
    }

    const handleResize = () => {
      heroHeight = section.offsetHeight || 1
      requestUpdate()
    }

    section.addEventListener('pointermove', handlePointerMove)
    section.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      section.removeEventListener('pointermove', handlePointerMove)
      section.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="
        relative
        h-svh
        min-h-150
        sm:min-h-170
        max-h-250
        overflow-hidden
        bg-pancho-orange
        bg-[url('/images/fondo-papel.webp')]
        bg-cover
        bg-center
        sm:bg-[url('/images/fondo-papel-h.webp')]
      "
    >
      {/* =========================================================
          BANDA VERTICAL ROJA (como el flyer de delivery) — solo en pantallas grandes
      ========================================================= */}

      <div
        aria-hidden="true"
        className="
          hero-band
          absolute
          inset-y-0
          right-0
          z-10
          hidden
          w-18
          items-center
          justify-center
          bg-pancho-red
          lg:flex
        "
      >
        <span className="hero-band-text rotate-180 whitespace-nowrap font-sans text-4xl font-black uppercase tracking-[0.04em] text-white [writing-mode:vertical-rl]">
          Delivery y retiro
        </span>
      </div>

      {/* =========================================================
          CONTENEDOR DE CONTENIDO
      ========================================================= */}

      <div
        className="
          relative
          z-20
          mx-auto
          flex
          h-full
          w-full
          max-w-360
          flex-col
          justify-start
          px-5
          pt-24

          sm:flex-row
          sm:items-center
          sm:gap-8
          sm:px-6
          sm:pt-0
          lg:pl-8
          lg:pr-28
        "
      >
        {/* =======================================================
            TEXTO
            Sobre el naranja, el blanco es solo para el titular: todo el texto chico va en negro.
        ======================================================= */}

        <div ref={textRef} className="relative z-30 w-full will-change-transform sm:max-w-155 lg:max-w-165">
          {/* Etiqueta recta roja, girada como en los flyers: se pega de izquierda a derecha */}
          <span
            style={{ '--d': '250ms' } as React.CSSProperties}
            className="
              load-wipe
              inline-block
              -rotate-4
              bg-pancho-red
              px-2
              py-1
              font-sans
              text-[19px]
              font-extrabold
              uppercase
              leading-[1.1]
              whitespace-nowrap
              text-white

              sm:text-xl
              sm:tracking-[0.02em]
            "
          >
            Hamburguesas y panchos
          </span>

          {/* Titular de un solo color: sube línea por línea */}
          <h1
            style={{ '--d': '380ms' } as React.CSSProperties}
            className="
              load-lines
              mt-5
              text-7xl
              leading-[0.9]
              text-white

              sm:mt-7
              sm:text-8xl
              lg:mt-9
              lg:text-9xl
            "
          >
            <SplitLines lines={['¿Qué vas', 'a pedir?']} />
          </h1>

          <p
            style={{ '--d': '720ms' } as React.CSSProperties}
            className="
              load-up
              mt-4
              max-w-70
              text-balance
              text-base
              font-medium
              leading-relaxed
              text-pancho-black

              sm:mt-6
              sm:max-w-110
              sm:text-lg
            "
          >
            Armá tu pedido en el menú y elegí delivery o retiro.
          </p>

          {/* Botón principal sobre naranja: bloque negro con la flecha en un cuadrado blanco */}
          <div className="load-up mt-6 sm:mt-8" style={{ '--d': '840ms' } as React.CSSProperties}>
            <PanchoButton href="/menu" size="lg">
              Hacer pedido
            </PanchoButton>
          </div>
        </div>

        {/* =======================================================
            HAMBURGUESA
            Recortada, sin fondo, directo sobre el naranja. Este hueco marca su lugar:
            al hacer scroll, <BurgerTraveler> la lleva desde acá hasta su mitad en la
            sección de elección. La imagen de adentro es la versión fija, para cuando
            no hay JavaScript o el usuario pidió menos movimiento.
        ======================================================= */}

        <div
          data-burger-slot="hero"
          className="
            hero-burger-in
            pointer-events-none
            absolute
            bottom-4
            left-1/2
            aspect-718/442
            w-[min(88%,46svh)]
            -translate-x-1/2

            sm:static
            sm:ml-auto
            sm:w-[min(50vw,40rem)]
            sm:shrink-0
            sm:translate-x-0
          "
        >
          <div data-hero-parallax className="burger-art animate-float relative h-full w-full">
            <Image
              src="/images/hamburguesa-recortada.webp"
              alt="Hamburguesa de Don Pancho & Burger con cheddar, panceta, tomate y lechuga"
              fill
              priority
              sizes="(max-width: 640px) 88vw, 640px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

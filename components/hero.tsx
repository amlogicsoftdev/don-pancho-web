'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { PanchoButton } from './pancho-button'
import { SplitLines } from './split-lines'

const TAG = 'Hamburguesas y panchos'

/**
 * Primera pantalla. Al cargar se arma como un afiche, en orden: la etiqueta se imprime
 * y se pega torcida, las letras del titular se paran una por una, una tira negra destapa
 * cada renglón de la bajada, el botón encaja sus dos bloques y la hamburguesa cae girada
 * (las entradas están en app/globals.css y corren sin JavaScript).
 *
 * No tiene fondo propio: el papel naranja es del escenario (.intro-stage), que comparte
 * con la mitad de la hamburguesa de la sección de elección: de ese lado no hay corte.
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
        z-10
        h-svh
        min-h-150
        md:min-h-170
        max-h-250
        overflow-hidden
      "
    >
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

          sm:px-6
          md:flex-row
          md:items-center
          md:gap-8
          md:pt-0
          lg:px-8
        "
      >
        {/* =======================================================
            TEXTO
            Sobre el naranja, el blanco es solo para el titular: todo el texto chico va en negro.
        ======================================================= */}

        <div ref={textRef} className="relative z-30 w-full will-change-transform md:max-w-155 lg:max-w-165">
          {/* Etiqueta recta roja, como en los flyers: se imprime letra por letra y se pega torcida */}
          <span
            style={{ '--d': '200ms', '--n': TAG.length } as React.CSSProperties}
            className="
              hero-tag
              -rotate-4
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
            <span className="sr-only">{TAG}</span>
            <span aria-hidden="true">
              {Array.from(TAG).map((char, index) => (
                <span key={index} className="hero-tag__char" style={{ '--i': index } as React.CSSProperties}>
                  {char}
                </span>
              ))}
            </span>
          </span>

          {/* Titular de un solo color: las letras se paran una por una */}
          <h1
            style={{ '--d': '380ms' } as React.CSSProperties}
            className="
              load-chars
              mt-5
              text-7xl
              leading-[0.9]
              whitespace-nowrap
              text-white

              sm:mt-7
              lg:mt-9
              lg:text-8xl
              xl:text-9xl
            "
          >
            <SplitLines lines={['¿Qué vas', 'a pedir?']} />
          </h1>

          {/* Bajada en dos renglones: una tira negra tapa cada uno y lo destapa */}
          <p
            className="
              mt-4
              text-base
              font-medium
              leading-relaxed
              text-pancho-black

              sm:mt-6
              sm:text-lg
            "
          >
            <span className="block-line" style={{ '--d': '820ms' } as React.CSSProperties}>
              <span className="block-line__text">Armá tu pedido en el menú</span>
            </span>{' '}
            <span className="block-line" style={{ '--d': '940ms' } as React.CSSProperties}>
              <span className="block-line__text">y elegí delivery o retiro.</span>
            </span>
          </p>

          {/* Botón principal sobre naranja: sus dos bloques llegan por separado y encajan */}
          <div className="btn-in mt-6 sm:mt-8" style={{ '--d': '1020ms' } as React.CSSProperties}>
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
            aspect-771/524
            w-[min(88%,46svh)]
            -translate-x-1/2

            md:static
            md:ml-auto
            md:w-[min(44vw,40rem)]
            md:shrink-0
            md:translate-x-0
            lg:w-[min(50vw,40rem)]
          "
        >
          <div data-hero-parallax className="burger-art animate-float relative h-full w-full">
            <Image
              src="/images/hero-eleccion-hamburguesa.webp"
              alt="Hamburguesa de Don Pancho & Burger con cheddar fundido, cebolla y salsa"
              fill
              priority
              sizes="(max-width: 768px) 88vw, 640px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

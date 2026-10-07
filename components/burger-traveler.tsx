'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

// Punto del viaje (de 0 a 1) en el que la hamburguesa se da por llegada
const ARRIVE_AT = 0.96

interface BurgerTravelerProps {
  /** Avisa que la hamburguesa ya está en su lugar en la sección de elección. */
  onArrive?: () => void
}

/**
 * La hamburguesa que viaja: arranca en su hueco del hero y, a medida que se hace
 * scroll, se desplaza y se achica hasta el hueco de la mitad «Hamburguesa» de la
 * sección de elección.
 *
 * Los huecos son los elementos con `data-burger-slot="hero"` y `data-burger-slot="versus"`.
 * Tiene que renderizarse dentro del mismo contenedor `.intro-stage` que los contiene.
 *
 * Cada hueco trae su propia imagen fija. Esta capa las reemplaza recién cuando está
 * lista (pone `data-travel="on"` en el contenedor), así que sin JavaScript o con
 * «reducir movimiento» la hamburguesa se ve igual, quieta, en los dos lugares.
 *
 * `onArrive` se llama una sola vez, cuando la hamburguesa llega a la sección de elección
 * (o enseguida, si no va a viajar): es la señal para que esa sección muestre su contenido.
 *
 * Si el navegador sabe animar con el scroll (`animation-timeline: scroll()`: Chrome, Edge,
 * Safari nuevo), el viaje lo hace el navegador en el mismo paso que el scroll: acá solo se miden
 * los dos huecos y se pasan como variables de CSS. Así en el celular la hamburguesa no queda un
 * cuadro atrás del scroll (eso la hacía ver trabada). Si no, la mueve este componente en cada
 * cuadro, como antes.
 */
export function BurgerTraveler({ onArrive }: BurgerTravelerProps) {
  const travelerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const traveler = travelerRef.current
    const stage = traveler?.closest<HTMLElement>('.intro-stage')
    if (!traveler || !stage) return

    const heroSlot = stage.querySelector<HTMLElement>('[data-burger-slot="hero"]')
    const versusSlot = stage.querySelector<HTMLElement>('[data-burger-slot="versus"]')
    // Sin viaje no hay llegada que esperar: la sección de elección se muestra de entrada
    if (!heroSlot || !versusSlot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onArrive?.()
      return
    }

    const conCss = CSS.supports('animation-timeline: scroll()')

    // Posición y tamaño de cada hueco, relativos al contenedor
    let from = { x: 0, y: 0, w: 0, h: 0 }
    let to = { x: 0, y: 0, w: 0, h: 0 }
    // Scroll en el que la hamburguesa termina de llegar a la sección de elección
    let endScroll = 1
    let active = false
    let arrived = false
    let rafId: number | null = null
    // Ancho con el que se midió: en el celular, al scrollear se esconde la barra de direcciones y
    // cambia el alto de la pantalla; eso no mueve los huecos, así que no hace falta volver a medir
    let anchoMedido = 0

    const measure = () => {
      const stageRect = stage.getBoundingClientRect()
      const heroRect = heroSlot.getBoundingClientRect()
      const versusRect = versusSlot.getBoundingClientRect()

      from = {
        x: heroRect.left - stageRect.left,
        y: heroRect.top - stageRect.top,
        w: heroRect.width,
        h: heroRect.height,
      }
      to = {
        x: versusRect.left - stageRect.left,
        y: versusRect.top - stageRect.top,
        w: versusRect.width,
        h: versusRect.height,
      }

      // Llega cuando la sección de elección ya ocupa casi toda la pantalla. Se usa el alto que no
      // cambia con la barra de direcciones del celular (si no, el viaje se recalcula a mitad de camino)
      const versusSection = versusSlot.closest('section')
      const sectionTop =
        (versusSection ?? versusSlot).getBoundingClientRect().top + window.scrollY
      endScroll = Math.max(1, sectionTop - document.documentElement.clientHeight * 0.12)
      anchoMedido = window.innerWidth

      traveler.style.width = `${from.w}px`
      traveler.style.height = `${from.h}px`

      if (conCss) {
        // El viaje lo anima el CSS (.intro-stage[data-viaje='css'] en globals.css)
        traveler.style.setProperty('--viaje-x0', `${from.x}px`)
        traveler.style.setProperty('--viaje-y0', `${from.y}px`)
        traveler.style.setProperty('--viaje-x1', `${to.x}px`)
        traveler.style.setProperty('--viaje-y1', `${to.y}px`)
        traveler.style.setProperty('--viaje-escala', String(from.w > 0 ? to.w / from.w : 1))
        traveler.style.setProperty('--viaje-fin', `${endScroll}px`)
      }
    }

    const update = () => {
      rafId = null
      if (!active) return

      const progress = Math.max(0, Math.min(1, window.scrollY / endScroll))

      // Ya casi en su lugar: se avisa una sola vez
      if (!arrived && progress >= ARRIVE_AT) {
        arrived = true
        onArrive?.()
      }
      // Con CSS no hay nada más que hacer: la posición la pone el navegador
      if (conCss) return
      // Arranque y llegada suaves
      const eased = progress * progress * (3 - 2 * progress)

      const x = from.x + (to.x - from.x) * eased
      const y = from.y + (to.y - from.y) * eased
      const scale = from.w > 0 ? 1 + (to.w / from.w - 1) * eased : 1
      // Se inclina un poco a mitad de camino y llega derecha
      const tilt = Math.sin(Math.PI * progress) * -7

      // El giro es alrededor del centro de la hamburguesa, no de su esquina
      const cx = from.w / 2
      const cy = from.h / 2

      traveler.style.transform =
        `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)}) ` +
        `translate(${cx}px, ${cy}px) rotate(${tilt.toFixed(2)}deg) translate(${-cx}px, ${-cy}px)`
    }

    const requestUpdate = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    const activate = () => {
      if (active) return
      active = true
      measure()
      update()
      if (conCss) stage.dataset.viaje = 'css'
      stage.dataset.travel = 'on'
    }

    const handleResize = () => {
      if (!active) return
      measure()
      requestUpdate()
    }

    // La ventana: solo si cambió el ancho (el alto cambia solo con la barra del celular)
    const handleWindowResize = () => {
      if (window.innerWidth !== anchoMedido) handleResize()
    }

    const handleScroll = () => {
      // Si el usuario scrollea antes de que termine la entrada del hero, toma el control ya
      if (!active) activate()
      requestUpdate()
    }

    // Toma el control o, si ya lo tenía, vuelve a medir
    const sync = () => {
      if (!active) {
        activate()
        return
      }
      measure()
      requestUpdate()
    }

    // Espera a que termine la animación de entrada del hero: mientras dura,
    // el hueco está desplazado y la medición saldría corrida
    const handleEntranceEnd = (event: AnimationEvent) => {
      if (event.target === heroSlot) sync()
    }
    heroSlot.addEventListener('animationend', handleEntranceEnd)
    const fallbackTimer = window.setTimeout(sync, 1800)
    // Si la página abre ya scrolleada (recarga, botón «atrás»), no hay entrada que esperar
    if (window.scrollY > 0) activate()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleWindowResize)
    // El contenedor: si cambia de tamaño (carga de imágenes, fuentes), se vuelve a medir
    let anchoStage = 0
    let altoStage = 0
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (Math.abs(width - anchoStage) < 1 && Math.abs(height - altoStage) < 1) return
      anchoStage = width
      altoStage = height
      handleResize()
    })
    resizeObserver.observe(stage)

    return () => {
      window.clearTimeout(fallbackTimer)
      if (rafId !== null) cancelAnimationFrame(rafId)
      heroSlot.removeEventListener('animationend', handleEntranceEnd)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleWindowResize)
      resizeObserver.disconnect()
      delete stage.dataset.travel
      delete stage.dataset.viaje
    }
  }, [onArrive])

  return (
    <div
      ref={travelerRef}
      aria-hidden="true"
      // Tamaño inicial con la proporción del hueco del hero (la imagen con `fill` necesita alto);
      // measure() lo reemplaza por el tamaño exacto antes de mostrarla
      className="burger-traveler pointer-events-none absolute left-0 top-0 z-20 aspect-771/524 w-[min(88vw,40rem)] origin-top-left will-change-[transform,translate,scale]"
    >
      {/* Inclinación a mitad de camino (cuando el viaje lo anima el CSS) */}
      <div className="burger-traveler-giro h-full w-full">
        {/* Pose: crece o se achica cuando se elige una mitad en la sección de elección */}
        <div className="burger-traveler-pose h-full w-full">
          <div data-hero-parallax className="burger-art burger-traveler-art animate-float relative h-full w-full">
            <Image
              src="/images/hero-eleccion-hamburguesa.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 88vw, 640px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

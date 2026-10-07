'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useInView } from '@/hooks/use-in-view'
import { SplitLines } from './split-lines'

interface Note {
  title: string
  text: string
  /** Posición del punto sobre la foto de la hamburguesa, en porcentaje. */
  x: number
  y: number
  /** De qué lado de la hamburguesa va la nota en escritorio. */
  side: 'left' | 'right'
  /** Lugar de la nota en la grilla de escritorio. */
  place: string
}

// En el orden en que aparecen en la hamburguesa, de arriba hacia abajo
const NOTES: Note[] = [
  {
    title: 'Pan de papa diario',
    text: 'Horneado cada mañana. Ultra esponjoso, tostado en manteca y con la resistencia justa para aguantar cada bocado sin desarmarse.',
    x: 62,
    y: 22,
    side: 'right',
    place: 'xl:col-start-3 xl:row-start-1 xl:self-start',
  },
  {
    title: 'Cascada de cheddar',
    text: 'El corazón de Don Pancho. Queso cheddar de verdad, fundido al vapor para envolver cada piso con la textura cremosa que nos define.',
    x: 33,
    y: 50,
    side: 'left',
    place: 'xl:col-start-1 xl:row-start-1 xl:row-span-2 xl:self-center xl:text-right',
  },
  {
    title: 'El blend smash',
    text: 'Cortes seleccionados 100% novillo. Smasheados al hierro candente para lograr esa costra dorada crocante que concentra todo el jugo.',
    x: 55,
    y: 63,
    side: 'right',
    place: 'xl:col-start-3 xl:row-start-2 xl:self-end',
  },
]

/**
 * «Nuestro secreto artesanal»: la hamburguesa al centro y tres notas alrededor
 * (pan, cheddar y carne), cada una unida por una línea a su lugar en la hamburguesa.
 *
 * - En escritorio las líneas se dibujan cuando la sección entra en pantalla. Al pasar
 *   el mouse por una nota o por su punto, esa nota queda señalada y las otras se apagan.
 * - En celular no hay líneas: los puntos llevan número y las notas van en lista.
 * - El panel naranja entra angosto, con las puntas de arriba redondeadas, y se abre
 *   a todo el ancho a medida que se scrollea.
 *
 * Los estilos están en app/globals.css, bajo «Nuestro secreto artesanal».
 */
export function SecretSection() {
  const { ref: headRef, isInView: isHeadInView } = useInView({ threshold: 0.4 })
  const { ref: stageRef, isInView: isStageInView } = useInView({ threshold: 0.3 })
  const panelRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLDivElement>(null)
  const noteRefs = useRef<(HTMLDivElement | null)[]>([])
  const ruleRefs = useRef<(HTMLDivElement | null)[]>([])
  const lineRefs = useRef<(SVGPathElement | null)[]>([])
  const [active, setActive] = useState<number | null>(null)

  // Líneas de cada nota a su punto. Se calculan a partir de cajas que no se animan
  // (la celda de la nota y la caja de la hamburguesa), así el resultado no depende
  // del momento de la entrada.
  useEffect(() => {
    const stage = stageRef.current
    const burger = burgerRef.current
    if (!stage || !burger) return

    const desktop = window.matchMedia('(min-width: 80rem)')

    const draw = () => {
      const stageRect = stage.getBoundingClientRect()
      const burgerRect = burger.getBoundingClientRect()

      NOTES.forEach((note, index) => {
        const cell = noteRefs.current[index]
        const rule = ruleRefs.current[index]
        const line = lineRefs.current[index]
        if (!cell || !rule || !line) return

        if (!desktop.matches) {
          line.removeAttribute('d')
          return
        }

        const cellRect = cell.getBoundingClientRect()
        // Punta de la raya que mira a la hamburguesa (offset* no cuenta transformaciones)
        const startX =
          cellRect.left - stageRect.left + rule.offsetLeft + (note.side === 'left' ? rule.offsetWidth : 0)
        const startY = cellRect.top - stageRect.top + rule.offsetTop + rule.offsetHeight / 2
        const endX = burgerRect.left - stageRect.left + (burgerRect.width * note.x) / 100
        const endY = burgerRect.top - stageRect.top + (burgerRect.height * note.y) / 100
        // Un tramo recto que sigue la raya y después baja o sube hasta el punto
        const elbowX = startX + (endX - startX) * 0.4

        line.setAttribute(
          'd',
          `M ${startX.toFixed(1)} ${startY.toFixed(1)} H ${elbowX.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`,
        )
      })
    }

    const observer = new ResizeObserver(draw)
    observer.observe(stage)
    desktop.addEventListener('change', draw)

    return () => {
      observer.disconnect()
      desktop.removeEventListener('change', draw)
    }
  }, [stageRef])

  // El panel naranja se abre con el scroll: de angosto y redondeado a todo el ancho
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId: number | null = null

    const update = () => {
      rafId = null
      const top = panel.getBoundingClientRect().top
      const viewport = window.innerHeight
      // 0 cuando el panel asoma por abajo; 1 cuando su borde de arriba llegó a mitad de pantalla
      const progress = Math.max(0, Math.min(1, (viewport - top) / (viewport * 0.5)))
      const rest = 1 - progress

      panel.style.clipPath =
        rest === 0
          ? ''
          : `inset(${(rest * 56).toFixed(1)}px ${(rest * 6).toFixed(2)}% 0 round ${(rest * 32).toFixed(1)}px ${(rest * 32).toFixed(1)}px 0 0)`
    }

    const requestUpdate = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      panel.style.clipPath = ''
    }
  }, [])

  // Señalar una nota es cosa de mouse: en táctil el «hover» queda pegado después de tocar
  const point = (index: number) => (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') setActive(index)
  }
  const release = () => setActive(null)

  return (
    <section
      aria-labelledby="secreto-titulo"
      className="relative bg-pancho-paper bg-[url('/images/fondo-papel-crema.webp')] bg-cover bg-center"
    >
      <div
        ref={panelRef}
        className="secret-panel bg-pancho-orange bg-[url('/images/fondo-papel-h.webp')] bg-cover bg-center py-20 text-pancho-black sm:py-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div ref={headRef} data-inview={isHeadInView} className="mx-auto max-w-3xl text-center">
            <h2
              id="secreto-titulo"
              className="rv-chars text-5xl sm:text-7xl lg:text-8xl text-white leading-[0.95]"
            >
              <SplitLines lines={['Nuestro secreto', 'artesanal']} />
            </h2>
            <p
              style={{ '--d': '420ms' } as React.CSSProperties}
              className="rv-up mx-auto mt-5 max-w-md text-balance text-base font-medium leading-relaxed sm:text-lg"
            >
              La diferencia está en tres cosas: el pan, el cheddar y la carne.
            </p>
          </div>

          {/* Hamburguesa y notas */}
          <div
            ref={stageRef}
            data-inview={isStageInView}
            data-active={active ?? undefined}
            className="secret-stage relative mt-12 flex flex-col gap-10 sm:mt-16 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)_minmax(0,1fr)] xl:items-center xl:gap-x-12 xl:gap-y-20"
          >
            {/* Líneas de las notas a sus puntos (solo escritorio) */}
            <svg className="secret-lines hidden xl:block" aria-hidden="true">
              {NOTES.map((note, index) => (
                <path
                  key={note.title}
                  ref={(el) => {
                    lineRefs.current[index] = el
                  }}
                  className="secret-line"
                  pathLength={1}
                  data-on={active === index || undefined}
                  style={{ '--d': `${650 + index * 160}ms` } as React.CSSProperties}
                />
              ))}
            </svg>

            {/* Hamburguesa recortada, con un punto por nota */}
            <div
              ref={burgerRef}
              className="relative mx-auto aspect-718/442 w-full max-w-136 xl:col-start-2 xl:row-span-2 xl:row-start-1"
            >
              <div className="secret-burger relative h-full w-full">
                <Image
                  src="/images/hamburguesa-recortada.webp"
                  alt="Hamburguesa de Don Pancho & Burger: pan de papa, cheddar fundido y carne smash"
                  fill
                  sizes="(max-width: 640px) 92vw, 544px"
                  className="object-contain"
                />
              </div>

              {NOTES.map((note, index) => (
                <span
                  key={note.title}
                  aria-hidden="true"
                  className="secret-dot"
                  data-on={active === index || undefined}
                  onPointerEnter={point(index)}
                  onPointerLeave={release}
                  style={
                    {
                      '--x': `${note.x}%`,
                      '--y': `${note.y}%`,
                      '--d': `${1350 + index * 160}ms`,
                    } as React.CSSProperties
                  }
                >
                  {index + 1}
                </span>
              ))}
            </div>

            {/* Notas */}
            {NOTES.map((note, index) => (
              <div
                key={note.title}
                ref={(el) => {
                  noteRefs.current[index] = el
                }}
                data-on={active === index || undefined}
                onPointerEnter={point(index)}
                onPointerLeave={release}
                className={`secret-note relative z-2 mx-auto w-full max-w-md xl:mx-0 xl:max-w-none ${note.place}`}
              >
                <div
                  className={`flex items-center gap-3 ${note.side === 'left' ? 'xl:justify-end' : ''}`}
                >
                  {/* En celular, el mismo número que lleva el punto */}
                  <span
                    aria-hidden="true"
                    className="grid size-7 flex-none place-items-center rounded-full border-[3px] border-pancho-black bg-white font-sans text-xs font-extrabold leading-none xl:hidden"
                  >
                    {index + 1}
                  </span>
                  <h3
                    style={{ '--d': `${150 + index * 160}ms` } as React.CSSProperties}
                    className="rv-chars text-4xl leading-none text-white sm:text-5xl"
                  >
                    <SplitLines lines={[note.title]} />
                  </h3>
                </div>

                <div
                  ref={(el) => {
                    ruleRefs.current[index] = el
                  }}
                  className="secret-rule mt-3"
                  style={
                    {
                      transformOrigin: note.side === 'left' ? '100% 50%' : '0 50%',
                      '--d': `${350 + index * 160}ms`,
                    } as React.CSSProperties
                  }
                />

                <p
                  style={{ '--d': `${450 + index * 160}ms` } as React.CSSProperties}
                  className="rv-up mt-4 text-[15px] font-medium leading-relaxed sm:text-base"
                >
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

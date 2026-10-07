'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useInView } from '@/hooks/use-in-view'
import { PanchoButton } from './pancho-button'
import { Stamp } from './stamp'

// --- Título: tres renglones, letra por letra. La última palabra va sobre el bloque naranja. ---
const TITLE_SOURCE: { text: string; mark?: boolean }[][] = [
  [{ text: 'Una' }, { text: 'pasión' }],
  [{ text: 'que' }, { text: 'se' }],
  [{ text: 'comparte', mark: true }],
]
const TITLE_TEXT = TITLE_SOURCE.map((line) => line.map((word) => word.text).join(' ')).join(' ')
const TITLE_LETTERS = TITLE_TEXT.replace(/\s/g, '').length
// `first` es el número de la primera letra de cada palabra dentro del título completo
const TITLE_LINES = TITLE_SOURCE.map((line, lineIndex) =>
  line.map((word, wordIndex) => {
    const before = [...TITLE_SOURCE.slice(0, lineIndex).flat(), ...line.slice(0, wordIndex)]
    return { ...word, first: before.reduce((total, previous) => total + previous.text.length, 0) }
  }),
)
// Tramo (en letras) que tarda cada letra en terminar de entintarse
const TITLE_SPREAD = 4

// --- Párrafo, palabra por palabra ---
const TEXT_PARTS: { text: string; bold?: boolean; mark?: boolean; tail?: string }[] = [
  { text: 'En' },
  { text: 'Don Pancho & Burger', bold: true },
  { text: 'creemos que una buena hamburguesa no es solo comida, es una' },
  { text: 'experiencia', mark: true, tail: '.' },
  { text: 'Por eso, usamos ingredientes de calidad, recetas originales y mucho amor en cada pedido.' },
]
const TEXT_WORDS = TEXT_PARTS.flatMap((part) => {
  const words = part.text.split(' ')
  return words.map((word, index) => ({
    text: word,
    bold: part.bold,
    mark: part.mark,
    tail: index === words.length - 1 ? part.tail : undefined,
  }))
})
const TEXT_SPREAD = 6

const VALUES = ['Entrá al menú', 'Armá tu pedido', 'Elegí delivery o retiro']

/**
 * Grupo que se entinta con el scroll. El componente escribe en él la variable --p, que va
 * de 0 a `steps`; cada pieza de adentro lleva su número en --i y se llena cuando --p la
 * alcanza (ver «Nosotros» en app/globals.css).
 *
 * - from: a qué altura de la pantalla (0 arriba, 1 abajo) tiene que estar el borde de
 *   arriba del grupo para empezar.
 * - travel: cuánto scroll tarda en completarse, en alturas de pantalla…
 * - own: …más esta fracción de la altura del propio grupo.
 */
function inkProps(steps: number, from: number, travel: number, own: number) {
  return { 'data-ink': steps, 'data-ink-from': from, 'data-ink-travel': travel, 'data-ink-own': own }
}

/**
 * «Sobre nosotros»: a la izquierda dos fotos con sombra dura y el sello; a la derecha la
 * etiqueta, el título con la última palabra sobre un bloque naranja, el texto, los tres
 * pasos para pedir, y el botón a la carta.
 *
 * Todo se entinta con el scroll, y va y vuelve con él: las letras del título se llenan
 * una por una mientras el bloque naranja avanza por detrás, las fotos caen y se
 * asientan, el párrafo se llena palabra por palabra y los pasos entran de a uno.
 * Sin JavaScript o con «reducir movimiento» se ve todo entero desde el principio.
 *
 * No tiene fondo propio: el papel crema lo pone components/landing-view.tsx, que lo
 * comparte con las cifras para que no haya corte entre las dos secciones.
 */
export function AboutSection() {
  const { ref: headRef, isInView: isHeadInView } = useInView({ threshold: 0.6 })
  const { ref: footRef, isInView: isFootInView } = useInView({ threshold: 0.5 })
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Los grupos no se transforman (se mueven sus piezas), así que medirlos es estable
    const groups = Array.from(section.querySelectorAll<HTMLElement>('[data-ink]')).map((element) => ({
      element,
      steps: Number(element.dataset.ink),
      from: Number(element.dataset.inkFrom),
      travel: Number(element.dataset.inkTravel),
      own: Number(element.dataset.inkOwn),
    }))

    let rafId: number | null = null

    const update = () => {
      rafId = null
      const viewport = window.innerHeight

      for (const group of groups) {
        const rect = group.element.getBoundingClientRect()
        const distance = viewport * group.travel + rect.height * group.own
        const progress = Math.max(0, Math.min(1, (viewport * group.from - rect.top) / distance))
        group.element.style.setProperty('--p', (progress * group.steps).toFixed(3))
      }
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
      for (const group of groups) group.element.style.removeProperty('--p')
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="nosotros"
      aria-labelledby="nosotros-titulo"
      className="about relative w-full overflow-x-clip py-20 text-pancho-black sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado: la etiqueta que se pega y una línea que sigue hasta el borde de la columna del título */}
        <div ref={headRef} data-inview={isHeadInView} className="flex items-center gap-3 sm:gap-4">
          <span className="rv-slap inline-block flex-none -rotate-3 bg-pancho-red px-2 py-1 font-sans text-xs font-extrabold uppercase leading-none tracking-[0.04em] text-white shadow-[3px_3px_0_var(--color-pancho-black)] sm:text-sm">
            Sobre nosotros
          </span>
          <span aria-hidden="true" className="about-rule" />
        </div>

        <div className="mt-12 grid items-start gap-16 sm:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Fotos con sombra dura y el sello */}
          <div className="about-photos" {...inkProps(4.5, 1, 0.3, 0)}>
            <figure className="about-photo about-photo--big" style={{ '--i': 0, '--spread': 2 } as React.CSSProperties}>
              <div className="about-photo__card">
                <div className="relative aspect-4/5 overflow-hidden bg-pancho-surface">
                  <Image
                    src="/images/nosotros-hamburguesa-huevo.webp"
                    alt="Hamburguesa de Don Pancho & Burger con cheddar, panceta y huevo"
                    fill
                    sizes="(max-width: 640px) 60vw, 320px"
                    className="object-cover object-[50%_85%]"
                  />
                </div>
                <figcaption className="about-photo__tag about-photo__tag--dark">Don Pancho &amp; Burger</figcaption>
              </div>
            </figure>

            <figure
              className="about-photo about-photo--small"
              style={{ '--i': 1.5, '--spread': 2 } as React.CSSProperties}
            >
              <div className="about-photo__card">
                <div className="relative aspect-square overflow-hidden bg-pancho-black">
                  <Image
                    src="/images/nosotros-hamburguesa-oscura.webp"
                    alt="Hamburguesa con cheddar, panceta y cebolla caramelizada sobre fondo oscuro"
                    fill
                    sizes="(max-width: 640px) 45vw, 240px"
                    className="object-cover object-[50%_80%]"
                  />
                </div>
                <figcaption className="about-photo__tag about-photo__tag--red">Hamburguesas y panchos</figcaption>
              </div>
            </figure>

            <div className="about-stamp" style={{ '--i': 3, '--spread': 1.5 } as React.CSSProperties}>
              <Stamp className="size-full" />
            </div>
          </div>

          <div>
            {/* Título */}
            <h2
              id="nosotros-titulo"
              className="about-title"
              {...inkProps(TITLE_LETTERS + TITLE_SPREAD, 1, 0.2, 0.6)}
            >
              <span className="sr-only">{TITLE_TEXT}</span>
              <span aria-hidden="true">
                {TITLE_LINES.map((line, lineIndex) => (
                  <span key={lineIndex} className="about-title__line">
                    {line.map((word, wordIndex) => {
                      const letters = Array.from(word.text).map((char, charIndex) => (
                        <span
                          key={charIndex}
                          className="about-title__char"
                          style={{ '--i': word.first + charIndex, '--spread': TITLE_SPREAD } as React.CSSProperties}
                        >
                          {char}
                        </span>
                      ))
                      return (
                        <React.Fragment key={word.text}>
                          {wordIndex > 0 ? ' ' : null}
                          {word.mark ? (
                            <span className="about-mark">
                              {/* El bloque naranja avanza mientras se llenan las letras de su palabra */}
                              <span
                                className="about-mark__bg"
                                style={{ '--i': word.first, '--spread': word.text.length } as React.CSSProperties}
                              />
                              {letters}
                            </span>
                          ) : (
                            <span className="about-title__word">{letters}</span>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </span>
                ))}
              </span>
            </h2>

            {/* Párrafo */}
            <p className="about-text mt-7" {...inkProps(TEXT_WORDS.length + TEXT_SPREAD, 1, 0.2, 0.6)}>
              {TEXT_WORDS.map((word, index) => (
                <React.Fragment key={index}>
                  {index > 0 ? ' ' : null}
                  <span
                    className="about-text__word"
                    data-bold={word.bold || undefined}
                    data-mark={word.mark || undefined}
                    style={{ '--i': index, '--spread': TEXT_SPREAD } as React.CSSProperties}
                  >
                    {word.text}
                  </span>
                  {word.tail ? (
                    <span
                      className="about-text__word"
                      style={{ '--i': index, '--spread': TEXT_SPREAD } as React.CSSProperties}
                    >
                      {word.tail}
                    </span>
                  ) : null}
                </React.Fragment>
              ))}
            </p>

            {/* Los tres pasos */}
            <p className="about-label mt-8">Pedí en 3 pasos</p>
            <ol className="about-values mt-2" {...inkProps(VALUES.length + 0.5, 1, 0.1, 0.5)}>
              {VALUES.map((value, index) => (
                <li
                  key={value}
                  className="about-value"
                  style={{ '--i': index, '--spread': 1.5 } as React.CSSProperties}
                >
                  <span aria-hidden="true" className="about-value__num">
                    0{index + 1}
                  </span>
                  <span className="about-value__text">{value}</span>
                </li>
              ))}
            </ol>

            {/* Botón a la carta */}
            <div ref={footRef} data-inview={isFootInView} className="mt-8">
              <div className="rv-btn">
                <PanchoButton href="/menu">Ver el menú</PanchoButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

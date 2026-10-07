'use client'

import React, { useState, useEffect } from 'react'
import { useInView } from '@/hooks/use-in-view'
import { SplitLines } from './split-lines'

// Hook para conteo numérico animado suave con soporte de delay
function useAnimatedCount(
  target: number,
  isTriggered: boolean,
  duration: number = 1300,
  delay: number = 0
) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isTriggered) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let start: number | null = null
    let rafId: number

    const timeoutId = setTimeout(() => {
      if (prefersReducedMotion) {
        setCount(target)
        return
      }

      const step = (timestamp: number) => {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setCount(Math.round(easeOut * target))

        if (progress < 1) {
          rafId = requestAnimationFrame(step)
        }
      }

      rafId = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [target, isTriggered, duration, delay])

  return count
}

export function BenefitsSection() {
  // Observador para el encabezado
  const { ref: headerRef, isInView: isHeaderInView } = useInView({
    threshold: 0.2,
  })

  // Observador con rootMargin adecuado para mobile y desktop
  const { ref: gridRef, isInView: isGridInView } = useInView({
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  })

  // Cada contador arranca cuando su ticket se pega
  const countBurgers = useAnimatedCount(50, isGridInView, 1300, 0)
  const countCarne = useAnimatedCount(100, isGridInView, 1300, 110)
  const countRating = useAnimatedCount(49, isGridInView, 1300, 220)

  const items = [
    {
      metric: `+${countBurgers}K`,
      title: 'Burgers servidas',
      pill: '★ 100% artesanal',
      delay: 0,
      tilt: -3,
    },
    {
      metric: `${countCarne}%`,
      title: 'Carne fresca vacuna',
      pill: 'Novillo seleccionado',
      delay: 110,
      tilt: 2,
    },
    {
      metric: `${(countRating / 10).toFixed(1)} ★`,
      title: 'Calificación clientes',
      pill: '+10.000 reseñas reales',
      delay: 220,
      tilt: -1.5,
    },
    {
      metric: 'Express',
      title: 'Envíos a tu puerta',
      pill: 'Directo y caliente',
      delay: 330,
      tilt: 3,
    },
  ]

  return (
    <section className="relative overflow-hidden bg-pancho-paper bg-[url('/images/fondo-papel-crema.webp')] bg-cover bg-center py-20 text-pancho-black sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Encabezado de un solo color: las letras se paran una por una */}
        <div
          ref={headerRef}
          data-inview={isHeaderInView}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20"
        >
          <h2 className="rv-chars text-4xl sm:text-6xl lg:text-7xl text-pancho-black leading-[0.95]">
            <SplitLines lines={['La diferencia de hacer', 'una burger de verdad']} />
          </h2>
        </div>

        {/* Cada cifra en un ticket de comanda: se pegan uno después del otro, torcidos,
            y se enderezan al pasarles el mouse */}
        <div
          ref={gridRef}
          data-inview={isGridInView}
          className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 lg:grid-cols-4"
        >
          {items.map((item) => {
            return (
              <div
                key={item.title}
                className="rv-slap"
                style={{ '--d': `${item.delay}ms` } as React.CSSProperties}
              >
                <div className="ticket h-full" style={{ '--tilt': `${item.tilt}deg` } as React.CSSProperties}>
                  <div className="ticket__paper flex h-full flex-col items-center px-3 pt-6 pb-9 text-center sm:px-5 sm:pt-8 sm:pb-11">
                    {/* Cifra en tipografía display */}
                    <span className="font-display text-4xl leading-none whitespace-nowrap text-pancho-red-deep select-none sm:text-6xl lg:text-5xl xl:text-7xl">
                      {item.metric}
                    </span>

                    <h3 className="mt-3 mb-3 font-heading text-lg leading-tight text-pancho-black sm:text-2xl lg:text-xl xl:text-2xl">
                      {item.title}
                    </h3>

                    {/* Línea de corte, como en una comanda */}
                    <span aria-hidden="true" className="mt-auto mb-3 w-full border-t-2 border-dashed border-black/20 pt-0 sm:mb-4" />

                    <span className="text-[11px] font-bold uppercase leading-snug tracking-[0.1em] text-pancho-black/65">
                      {item.pill}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

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

  // Cada contador arranca cuando su cifra empieza a subir desde atrás de la máscara
  const countBurgers = useAnimatedCount(50, isGridInView, 1300, 0)
  const countCarne = useAnimatedCount(100, isGridInView, 1300, 110)
  const countRating = useAnimatedCount(49, isGridInView, 1300, 220)

  const items = [
    {
      metric: `+${countBurgers}K`,
      title: 'Burgers servidas',
      pill: '★ 100% artesanal',
      delay: 0,
    },
    {
      metric: `${countCarne}%`,
      title: 'Carne fresca vacuna',
      pill: 'Novillo seleccionado',
      delay: 110,
    },
    {
      metric: `${(countRating / 10).toFixed(1)} ★`,
      title: 'Calificación clientes',
      pill: '+10.000 reseñas reales',
      delay: 220,
    },
    {
      metric: 'Express',
      title: 'Envíos a tu puerta',
      pill: 'Directo y caliente',
      delay: 330,
    },
  ]

  return (
    <section className="py-20 sm:py-28 border-t border-neutral-900 bg-pancho-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Encabezado de un solo color: sube línea por línea */}
        <div
          ref={headerRef}
          data-inview={isHeaderInView}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-24"
        >
          <h2 className="rv-lines text-4xl sm:text-6xl lg:text-7xl text-white leading-[0.95]">
            <SplitLines lines={['La diferencia de hacer', 'una burger de verdad']} />
          </h2>
        </div>

        {/* Tira de cifras: cada una sube desde atrás de su máscara, una después de la otra */}
        <div
          ref={gridRef}
          data-inview={isGridInView}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8 lg:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-neutral-900/90 pt-4"
        >
          {items.map((item) => {
            return (
              <div
                key={item.title}
                className="flex flex-col items-center text-center px-4 pt-6 pb-8 sm:py-0"
              >
                {/* Cifra en tipografía display */}
                <div
                  className="rv-lines select-none"
                  style={{ '--d': `${item.delay}ms` } as React.CSSProperties}
                >
                  <span className="line-mask">
                    <span className="line font-display text-6xl sm:text-7xl lg:text-8xl leading-none text-pancho-orange">
                      {item.metric}
                    </span>
                  </span>
                </div>

                {/* Título y micro-etiqueta: aparecen apenas después de su cifra */}
                <div
                  className="rv-up mt-3.5"
                  style={{ '--d': `${item.delay + 260}ms` } as React.CSSProperties}
                >
                  <h3 className="font-heading text-xl sm:text-2xl text-white leading-tight">
                    {item.title}
                  </h3>

                  <div className="mt-2">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
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

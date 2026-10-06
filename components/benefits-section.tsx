'use client'

import React, { useState, useEffect } from 'react'
import { useInView } from '@/hooks/use-in-view'

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

    if (prefersReducedMotion) {
      setCount(target)
      return
    }

    let start: number | null = null
    let rafId: number
    let timeoutId: NodeJS.Timeout

    timeoutId = setTimeout(() => {
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

  // Los contadores numéricos arrancan justo en el momento en que cada tarjeta impacta
  const countBurgers = useAnimatedCount(50, isGridInView, 1300, 100)
  const countCarne = useAnimatedCount(100, isGridInView, 1200, 320)
  const countRating = useAnimatedCount(49, isGridInView, 1200, 540)

  const items = [
    {
      metric: `+${countBurgers}K`,
      title: 'Burgers servidas',
      pill: '★ 100% artesanal',
      delay: 100,
    },
    {
      metric: `${countCarne}%`,
      title: 'Carne fresca vacuna',
      pill: 'Novillo seleccionado',
      delay: 320,
    },
    {
      metric: `${(countRating / 10).toFixed(1)} ★`,
      title: 'Calificación clientes',
      pill: '+10.000 reseñas reales',
      delay: 540,
    },
    {
      metric: 'Express',
      title: 'Envíos a tu puerta',
      pill: 'Directo y caliente',
      delay: 760,
    },
  ]

  return (
    <section className="py-20 sm:py-28 border-t border-neutral-900 bg-cheesy-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Encabezado limpio */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 sm:mb-24 transition-all duration-700 ease-out ${
            isHeaderInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-white tracking-tight leading-tight">
            La diferencia de hacer una <span className="text-cheesy-yellow">burger de verdad</span>
          </h2>
        </div>

        {/* Tira editorial de alto impacto que se activa en cascada cuando el usuario scrollea bien adentro */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8 lg:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-neutral-900/90 pt-4"
        >
          {items.map((item) => {
            return (
              <div
                key={item.title}
                className="flex flex-col items-center text-center px-4 pt-6 pb-8 sm:py-0 group cursor-default"
              >
                {/* Contenedor métrica con el queso cheddar derretido naciendo directamente de su base */}
                <div
                  className="flex flex-col items-center select-none"
                  style={{
                    animation: isGridInView
                      ? `smashEntrance 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay}ms both`
                      : 'none',
                    opacity: isGridInView ? undefined : 0,
                  }}
                >
                  {/* Número o métrica en tipografía display */}
                  <span className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-none text-cheesy-yellow tracking-tight transition-transform duration-300 group-hover:scale-105">
                    {item.metric}
                  </span>

                  {/* Gota de queso cheddar derretido pegada al número (sin corte ni overflow-hidden) */}
                  <div
                    className="-mt-1 text-cheesy-yellow overflow-visible"
                    style={{
                      animation: isGridInView
                        ? `cheddarDripDeploy 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${item.delay + 180}ms both`
                        : 'none',
                      transformOrigin: 'top center',
                      opacity: isGridInView ? undefined : 0,
                    }}
                  >
                    <svg
                      viewBox="-2 0 72 22"
                      className="w-14 sm:w-18 h-3.5 sm:h-4.5 fill-cheesy-yellow overflow-visible transition-transform duration-300 group-hover:scale-y-125 origin-top"
                      aria-hidden="true"
                    >
                      <path d="M 0 0 L 0 3 C 8 3, 10 14, 18 14 C 24 14, 28 4, 36 4 C 44 4, 48 18, 56 18 C 62 18, 64 3, 68 3 L 68 0 Z" />
                    </svg>
                  </div>
                </div>

                {/* Título conciso y destacado */}
                <div
                  className="mt-3.5"
                  style={{
                    animation: isGridInView
                      ? `smashTitleReveal 0.5s ease-out ${item.delay + 280}ms both`
                      : 'none',
                    opacity: isGridInView ? undefined : 0,
                  }}
                >
                  <h3 className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-white uppercase tracking-wide leading-tight group-hover:text-cheesy-yellow transition-colors duration-200">
                    {item.title}
                  </h3>

                  {/* Micro-etiqueta dorada sutil */}
                  <div className="mt-2">
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-neutral-200 transition-colors">
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

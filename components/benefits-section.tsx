'use client'

import React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { SplitLines } from './split-lines'

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

  // Las reglas de la casa: cada una va en su ticket (grande, título y bajada)
  const items = [
    { metric: 'Ley #1', title: 'Se come con las manos', pill: 'Sin cubiertos, sin culpa', delay: 0, tilt: -3 },
    { metric: 'No apto', title: 'Para dietas', pill: 'Hoy no se cuentan calorías', delay: 110, tilt: 2 },
    { metric: 'Siempre', title: 'Hay lugar para una más', pill: 'Pedí la segunda', delay: 220, tilt: -1.5 },
    { metric: 'Advertencia', title: 'Crea adicción', pill: 'Probás una y volvés', delay: 330, tilt: 3 },
  ]

  return (
    <section className="relative overflow-hidden pt-4 pb-20 text-pancho-black sm:pt-6 sm:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Encabezado de un solo color: las letras se paran una por una */}
        <div
          ref={headerRef}
          data-inview={isHeaderInView}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20"
        >
          <h2 className="rv-chars text-4xl sm:text-6xl lg:text-7xl text-pancho-black leading-[0.95]">
            <SplitLines lines={['Las reglas', 'de la casa']} />
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
                    <span className="font-display text-3xl leading-none uppercase text-pancho-red-deep select-none sm:text-5xl lg:text-4xl xl:text-5xl">
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

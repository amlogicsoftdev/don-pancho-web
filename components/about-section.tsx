'use client'

import React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { PanchoButton } from './pancho-button'
import { SplitLines } from './split-lines'
import { Stamp } from './stamp'
import { TiltPhoto } from './tilt-photo'

/**
 * «Sobre nosotros», sobre papel crema: la foto en marco blanco con el sello girando
 * en la esquina y, al lado, etiqueta, título, texto y botón.
 * Todo entra cuando el bloque aparece en pantalla (data-inview).
 */
export function AboutSection() {
  const { ref, isInView } = useInView({
    threshold: 0.25,
    rootMargin: '0px 0px -100px 0px',
  })

  return (
    <section
      id="nosotros"
      className="relative w-full overflow-x-clip bg-pancho-paper bg-[url('/images/fondo-papel-crema.webp')] bg-cover bg-center py-20 text-pancho-black sm:py-28 lg:py-36"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          data-inview={isInView}
          className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center"
        >
          {/* Columna izquierda: foto en marco blanco, con profundidad, y el sello girando en la esquina */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <div className="rv-photo w-full max-w-xs sm:max-w-sm">
              <TiltPhoto
                src="/images/burger-1.webp"
                alt="Hamburguesa de Don Pancho & Burger con cheddar, bacon, tomate y lechuga"
                sizes="(max-width: 640px) 320px, 384px"
                imageClassName="object-[50%_72%]"
              >
                <div className="tilt-float -right-3 -bottom-9 sm:-right-10 sm:-bottom-10">
                  <div className="rv-pop" style={{ '--d': '700ms' } as React.CSSProperties}>
                    <Stamp className="size-28 sm:size-36" />
                  </div>
                </div>
              </TiltPhoto>
            </div>
          </div>

          {/* Columna derecha: etiqueta que se pega, título letra por letra, texto y botón que se arma */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="rv-slap inline-block -rotate-3 bg-pancho-red px-2 py-1 font-sans text-[19px] font-extrabold uppercase leading-[1.1] text-white sm:text-xl sm:tracking-[0.02em]">
              Sobre nosotros
            </span>

            <h2
              style={{ '--d': '160ms' } as React.CSSProperties}
              className="rv-chars mt-5 text-5xl sm:text-7xl lg:text-8xl text-pancho-black leading-[0.95]"
            >
              <SplitLines lines={['Una pasión', 'que se', 'comparte']} />
            </h2>

            <p
              style={{ '--d': '520ms' } as React.CSSProperties}
              className="rv-up mt-6 text-pancho-black/80 text-base sm:text-lg leading-relaxed max-w-lg font-medium"
            >
              En <strong className="text-pancho-black font-bold">Don Pancho & Burger</strong> creemos que una buena hamburguesa no es solo comida, es una experiencia. Por eso, usamos ingredientes de calidad, recetas originales y mucho amor en cada pedido.
            </p>

            <div className="rv-btn mt-8" style={{ '--d': '640ms' } as React.CSSProperties}>
              <PanchoButton href="/menu" variant="paper">
                Ver el menú
              </PanchoButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

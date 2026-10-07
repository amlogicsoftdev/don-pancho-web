'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useInView } from '@/hooks/use-in-view'
import { PanchoButtonContent, panchoButtonClass } from './pancho-button'

/**
 * Sección de elección, tomada del flyer «Hamburguesa vs Pancho»: la pantalla partida
 * al medio, naranja de un lado y rojo del otro. Cada mitad es un enlace a la carta ya
 * filtrada. Al pasar el mouse (o con el teclado) la mitad queda «seleccionada»: su
 * comida crece y se inclina, su botón se enciende y la otra mitad se apaga.
 *
 * Los estados de selección y las entradas están en app/globals.css, bajo
 * «Sección de elección» y «Entradas».
 */
export function VersusSection() {
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <section
      id="elegir"
      aria-labelledby="elegir-titulo"
      data-inview={isInView}
      className="versus relative overflow-hidden bg-pancho-black"
    >
      <div ref={ref} className="grid h-[86svh] min-h-130 max-h-225 grid-cols-2">
        {/* =======================================================
            MITAD HAMBURGUESA — papel naranja
        ======================================================= */}
        <Link
          href="/menu?categoria=hamburguesas"
          data-side="hamburguesa"
          aria-label="Elegir hamburguesa: ver las hamburguesas de la carta"
          className="versus-side relative block bg-pancho-orange bg-[url('/images/fondo-papel.webp')] bg-cover bg-center outline-none"
        >
          <span aria-hidden="true" className="versus-dim" />

          {/* Lugar de la hamburguesa: hasta acá llega la que viaja desde el hero.
              En celular se sale por el borde izquierdo, como en el flyer. */}
          <div
            data-burger-slot="versus"
            className="
              absolute
              top-[52%]
              left-[-14%]
              aspect-718/442
              w-[124%]
              -translate-y-1/2

              sm:left-1/2
              sm:w-[min(80%,34rem)]
              sm:-translate-x-1/2
            "
          >
            <div className="versus-food burger-art animate-float relative h-full w-full">
              <Image
                src="/images/hamburguesa-recortada.webp"
                alt=""
                fill
                sizes="(max-width: 640px) 62vw, 544px"
                className="object-contain"
              />
            </div>
          </div>

          <span className="versus-caption rv-up" style={{ '--d': '350ms' } as React.CSSProperties}>
            <span className="versus-label bg-pancho-red text-white">Hamburguesa</span>
            <span className={panchoButtonClass({ size: 'sm', className: 'versus-go' })}>
              <PanchoButtonContent>Elegir</PanchoButtonContent>
            </span>
          </span>
        </Link>

        {/* =======================================================
            MITAD PANCHO — papel rojo
        ======================================================= */}
        <Link
          href="/menu?categoria=panchos"
          data-side="pancho"
          aria-label="Elegir pancho: ver los panchos de la carta"
          className="versus-side relative block bg-pancho-red bg-[url('/images/fondo-papel-rojo.webp')] bg-cover bg-center outline-none"
        >
          <span aria-hidden="true" className="versus-dim" />

          {/* El pancho va entero y centrado en su mitad, con margen para que no lo corte
              el borde ni siquiera cuando crece al seleccionarlo */}
          <div
            className="
              absolute
              top-[50%]
              left-1/2
              aspect-521/730
              w-[84%]
              -translate-x-1/2
              -translate-y-1/2

              sm:w-[min(66%,23rem)]
            "
          >
            <div className="versus-pancho h-full w-full">
              <div className="versus-food pancho-art animate-float-reverse relative h-full w-full">
                <Image
                  src="/images/pancho-recortado.webp"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 44vw, 368px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <span className="versus-caption rv-up" style={{ '--d': '450ms' } as React.CSSProperties}>
            <span className="versus-label bg-white text-pancho-red-deep">Pancho</span>
            <span className={panchoButtonClass({ size: 'sm', className: 'versus-go' })}>
              <PanchoButtonContent>Elegir</PanchoButtonContent>
            </span>
          </span>
        </Link>
      </div>

      {/* =========================================================
          TÍTULO — dos etiquetas giradas sobre el corte, como en el flyer.
          Se pegan de un golpe cuando la sección entra en pantalla.
      ========================================================= */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex flex-col items-center px-4 sm:top-24">
        <span className="rv-slap -rotate-5 bg-pancho-black px-2 py-1 font-sans text-sm font-extrabold uppercase leading-[1.1] tracking-[0.06em] text-white sm:text-lg">
          Elegí uno
        </span>
        <h2
          id="elegir-titulo"
          style={{ '--d': '140ms' } as React.CSSProperties}
          className="rv-slap -rotate-5 mt-1 whitespace-nowrap bg-white px-3 py-1 text-center text-[26px] leading-none text-pancho-red-deep sm:px-4 sm:text-5xl lg:text-6xl"
        >
          ¿Hamburguesa o pancho?
        </h2>
      </div>

      {/* =========================================================
          «VS» sobre el corte
      ========================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[52%] z-30 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{ '--d': '300ms' } as React.CSSProperties}
          className="rv-pop flex size-14 items-center justify-center rounded-full bg-white font-display text-2xl leading-none text-pancho-red-deep shadow-xl sm:size-24 sm:text-5xl"
        >
          VS
        </div>
      </div>
    </section>
  )
}

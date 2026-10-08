'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PanchoButtonContent, panchoButtonClass } from './pancho-button'

interface VersusSectionProps {
  /** La hamburguesa que viaja ya llegó: se puede mostrar el resto. */
  ready: boolean
}

/**
 * Sección de elección, tomada del flyer «Hamburguesa vs Pancho» y pensada como la
 * pantalla de elegir jugador de un videojuego. Cada mitad es un enlace a la carta ya
 * filtrada. Las dos mitades miden lo mismo. Al pasar el mouse (o con el teclado) una
 * queda elegida: su comida crece y se inclina, y la otra mitad se apaga.
 *
 * El pancho va a la izquierda, sobre un rectángulo de papel rojo. La hamburguesa va a
 * la derecha, sobre el papel naranja del escenario (.intro-stage), que es el mismo del
 * hero: así la que viaja desde arriba baja derecho, sin cruzarse de lado.
 *
 * El pancho, el título, el «VS», los nombres y los botones esperan a `ready`: aparecen
 * recién cuando la hamburguesa que viaja llegó a su lugar (ver <BurgerTraveler>).
 *
 * Todo el comportamiento está en app/globals.css, bajo «Sección de elección».
 */
export function VersusSection({ ready }: VersusSectionProps) {
  return (
    <section id="elegir" aria-labelledby="elegir-titulo" data-inview={ready} className="versus relative">
      {/* Fondos: la mitad roja y el velo del lado naranja */}
      <span aria-hidden="true" className="versus-red" />
      <span aria-hidden="true" className="versus-veil" />

      {/* Sin z-index a propósito: así los nombres y botones (z-30) quedan por encima de la
          hamburguesa que viaja (z-20), que vive fuera de esta sección */}
      <div className="relative grid h-svh min-h-130 grid-cols-2">
        {/* =======================================================
            MITAD PANCHO — papel rojo, a la izquierda
        ======================================================= */}
        <Link
          href="/menu?categoria=panchos"
          data-side="pancho"
          aria-label="Elegir pancho: ver los panchos de la carta"
          className="versus-side relative block outline-none"
        >
          {/* El pancho va entero y centrado en su mitad, con margen para que no lo corte
              el borde ni siquiera cuando crece al elegirlo */}
          <div
            className="
              absolute
              top-[50%]
              left-1/2
              aspect-521/730
              w-[84%]
              -translate-x-1/2
              -translate-y-1/2

              sm:w-[min(62%,22rem)]
            "
          >
            <div className="versus-pancho h-full w-full">
              <div className="versus-food pancho-art animate-float-reverse relative h-full w-full">
                <Image
                  src="/images/pancho-recortado.webp"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 44vw, 352px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <span className="versus-caption rv-up" style={{ '--d': '360ms' } as React.CSSProperties}>
            <span className="versus-name">Pancho</span>
            <span className={panchoButtonClass({ size: 'sm', className: 'versus-go' })}>
              <PanchoButtonContent>Elegir</PanchoButtonContent>
            </span>
          </span>
        </Link>

        {/* =======================================================
            MITAD HAMBURGUESA — papel naranja, a la derecha: el mismo lado que en el hero
        ======================================================= */}
        <Link
          href="/menu?categoria=hamburguesas"
          data-side="hamburguesa"
          aria-label="Elegir hamburguesa: ver las hamburguesas de la carta"
          className="versus-side relative block outline-none"
        >
          {/* Lugar de la hamburguesa: hasta acá llega la que viaja desde el hero, que baja
              sin cambiar de lado. Va entera y centrada en su mitad, también en celular. */}
          <div
            data-burger-slot="versus"
            className="
              absolute
              top-[50%]
              left-1/2
              aspect-771/524
              w-[94%]
              -translate-x-1/2
              -translate-y-1/2

              sm:w-[min(80%,34rem)]
            "
          >
            <div className="versus-food burger-art animate-float relative h-full w-full">
              <Image
                src="/images/hero-eleccion-hamburguesa.webp"
                alt=""
                fill
                sizes="(max-width: 640px) 62vw, 544px"
                className="object-contain"
              />
            </div>
          </div>

          <span className="versus-caption rv-up" style={{ '--d': '460ms' } as React.CSSProperties}>
            <span className="versus-name">Hamburguesa</span>
            <span className={panchoButtonClass({ size: 'sm', className: 'versus-go' })}>
              <PanchoButtonContent>Elegir</PanchoButtonContent>
            </span>
          </span>
        </Link>
      </div>

      {/* =========================================================
          TÍTULO — una etiqueta girada sobre el corte, como en el flyer.
          Se pega de un golpe apenas llega la hamburguesa. Baja lo que mide la barra de
          arriba (que tapa el borde de la sección cuando ocupa toda la pantalla).
      ========================================================= */}
      <div className="pointer-events-none absolute inset-x-0 top-26 z-30 flex flex-col items-center px-4 sm:top-30 lg:top-34">
        <h2
          id="elegir-titulo"
          style={{ '--d': '240ms' } as React.CSSProperties}
          className="rv-slap -rotate-5 whitespace-nowrap bg-white px-3 py-1 text-center text-[26px] leading-none text-pancho-red-deep sm:px-4 sm:text-5xl lg:text-6xl"
        >
          ¿Hamburguesa o pancho?
        </h2>
      </div>

      {/* =========================================================
          «VS» sobre el corte
      ========================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[50%] z-30 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{ '--d': '120ms' } as React.CSSProperties}
          className="rv-pop flex size-14 items-center justify-center rounded-full bg-white font-display text-2xl leading-none text-pancho-red-deep shadow-xl sm:size-24 sm:text-5xl"
        >
          VS
        </div>
      </div>
    </section>
  )
}

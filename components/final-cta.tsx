'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'
import { PanchoButton } from './pancho-button'
import { useInView } from '@/hooks/use-in-view'
import { SITE_CONFIG } from '@/lib/data'

interface FinalCTAProps {
  /** Si el carrito tiene productos, el botón lo abre para terminar el pedido. */
  hasItems: boolean
  onOpenCart: () => void
}

export function FinalCTA({ hasItems, onOpenCart }: FinalCTAProps) {
  const router = useRouter()
  const { ref, isInView } = useInView({ threshold: 0.35 })

  // El pedido siempre se confirma desde el carrito, para que quede guardado en el sistema
  const handleAction = () => {
    if (hasItems) onOpenCart()
    else router.push('/menu')
  }

  return (
    <section
      id="contacto"
      className="relative w-full overflow-hidden bg-pancho-orange bg-[url('/images/fondo-papel-h.webp')] bg-cover bg-center text-pancho-black"
    >
      {/* Franja de papel naranja, de bordes rectos */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
        <div
          ref={ref}
          data-inview={isInView}
          className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6"
        >
          {/* Izquierda: sello de Don Pancho & Burger, que se pega girando */}
          <div className="rv-pop shrink-0 flex items-center justify-center">
            <Logo variant="footer" />
          </div>

          {/* Centro: botón principal sobre naranja */}
          <div
            className="rv-btn flex items-center justify-center select-none"
            style={{ '--d': '140ms' } as React.CSSProperties}
          >
            <PanchoButton onClick={handleAction}>
              {hasItems ? 'Terminar mi pedido' : 'Ver el menú'}
            </PanchoButton>
          </div>

          {/* Derecha: redes sociales, círculos negros con ícono blanco */}
          <div
            className="rv-up flex items-center gap-3 sm:gap-4 md:border-l md:border-black/25 md:pl-8"
            style={{ '--d': '260ms' } as React.CSSProperties}
          >
            <a
              href={SITE_CONFIG.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Don Pancho & Burger"
              className="size-11 rounded-full bg-pancho-black text-white flex items-center justify-center shadow-md cursor-pointer transition-transform duration-200 ease-(--ease-out) hover:-translate-y-1 active:scale-[0.97]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href={SITE_CONFIG.socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook de Don Pancho & Burger"
              className="size-11 rounded-full bg-pancho-black text-white flex items-center justify-center shadow-md cursor-pointer transition-transform duration-200 ease-(--ease-out) hover:-translate-y-1 active:scale-[0.97]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href={SITE_CONFIG.socialLinks.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok de Don Pancho & Burger"
              className="size-11 rounded-full bg-pancho-black text-white flex items-center justify-center shadow-md cursor-pointer transition-transform duration-200 ease-(--ease-out) hover:-translate-y-1 active:scale-[0.97]"
            >
              <svg className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.87-4.49V8.62a8.2 8.2 0 0 0 4.9 1.6V6.76c-.33-.02-.67-.04-1-.07z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
    </section>
  )
}


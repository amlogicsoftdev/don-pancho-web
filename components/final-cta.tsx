'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'
import { PanchoButton } from './pancho-button'
import { useInView } from '@/hooks/use-in-view'
import { SITE_CONFIG, formatPrice } from '@/lib/data'
import { CartItem } from '@/lib/types'

interface FinalCTAProps {
  cart?: CartItem[]
}

export function FinalCTA({ cart = [] }: FinalCTAProps) {
  const router = useRouter()
  const { ref, isInView } = useInView({ threshold: 0.35 })

  const handleAction = () => {
    if (cart.length > 0) {
      const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemLines = cart
        .map((item) => `🍔 ${item.quantity}x ${item.name} (${formatPrice(item.price * item.quantity)})`)
        .join('\n')

      const message = `¡Hola ${SITE_CONFIG.name}! 🍔 Quiero hacer el siguiente pedido:\n\n${itemLines}\n\n💰 Total: ${formatPrice(totalAmount)}\n\n📍 Mi dirección:\n💳 Método de pago:\n\n¡Muchas gracias!`
      const encoded = encodeURIComponent(message)
      window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encoded}`, '_blank', 'noopener,noreferrer')
    } else {
      router.push('/menu')
    }
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
            className="rv-up flex items-center justify-center select-none"
            style={{ '--d': '140ms' } as React.CSSProperties}
          >
            <PanchoButton
              onClick={handleAction}
              icon={
                <svg className="size-5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              }
            >
              Pedir por WhatsApp
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


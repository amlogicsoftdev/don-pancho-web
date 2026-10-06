'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Logo } from './logo'
import { SITE_CONFIG, formatPrice } from '@/lib/data'
import { CartItem } from '@/lib/types'

interface FinalCTAProps {
  cart?: CartItem[]
}

export function FinalCTA({ cart = [] }: FinalCTAProps) {
  const router = useRouter()

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
    <section id="contacto" className="relative w-full overflow-hidden bg-cheesy-black text-cheesy-black">
      {/* Ondulaciones orgánicas superiores con dirección ascendente en ambos bordes laterales (calcado de mockup.png) */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none -mb-px">
        <svg
          viewBox="0 0 1440 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-14 sm:h-20 lg:h-24 block text-cheesy-yellow"
          aria-hidden="true"
        >
          <path
            d="M 0,35 C 45,65 100,85 180,85 C 280,85 340,20 450,20 C 580,20 700,82 860,82 C 1050,82 1280,25 1440,25 L 1440,110 L 0,110 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="w-full bg-cheesy-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6">
          {/* Izquierda: Logo y mascota CheesyBite */}
          <div className="shrink-0 flex items-center justify-center">
            <Logo variant="footer" />
          </div>

          {/* Centro: Botón de WhatsApp flanqueado por las cuñas doodle del hero/nosotros más separadas */}
          <div className="flex items-center justify-center group cursor-pointer select-none">
            {/* 3 Cuñas doodle del lado izquierdo */}
            <div className="transition-all duration-300 ease-out group-hover:-translate-x-3 sm:group-hover:-translate-x-4 origin-right">
              <svg
                viewBox="0 0 54 60"
                fill="none"
                className="w-8 sm:w-11 h-10 sm:h-13 text-cheesy-black overflow-visible"
                aria-hidden="true"
              >
                {/* Cuña superior hacia arriba-izquierda (↖) */}
                <g className="transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:-translate-x-1.5">
                  <path
                    d="M 48 14 C 47 11 36 8 20 4 C 11 1.5 8 4 10 6 C 22 10 38 18 46 18 C 48 18 49 16 48 14 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
                {/* Cuña intermedia estrictamente horizontal hacia la izquierda (←) */}
                <g className="transition-transform duration-300 ease-out group-hover:-translate-x-2.5">
                  <path
                    d="M 48 27 C 46 27 34 28 8 28.5 C 5 28.5 5 31.5 8 31.5 C 34 32 46 33 48 33 C 50 33 50 27 48 27 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
                {/* Cuña inferior hacia abajo-izquierda (↙) */}
                <g className="transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:-translate-x-1.5">
                  <path
                    d="M 48 46 C 49 44 48 42 46 42 C 38 42 22 50 10 54 C 8 56 11 58.5 20 56 C 36 52 47 49 48 46 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>

            {/* Botón central WhatsApp con tipografía Inter y logo sin padding excesivo */}
            <button
              onClick={handleAction}
              style={{ fontFamily: 'var(--font-sans), sans-serif' }}
              className="mx-3 sm:mx-5 inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-cheesy-black hover:bg-[#1A1A1A] text-cheesy-yellow font-sans font-bold text-base sm:text-lg shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              {/* Ícono de WhatsApp integrado directamente sin padding excesivo */}
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"
                  fill="#F5B900"
                />
                <path
                  d="M17.47 14.38C17.17 14.23 15.72 13.52 15.45 13.42C15.18 13.32 14.98 13.27 14.78 13.57C14.58 13.87 14.01 14.53 13.84 14.73C13.67 14.93 13.49 14.95 13.19 14.8C12.89 14.65 11.93 14.34 10.8 13.33C9.92 12.54 9.32 11.57 9.15 11.27C8.98 10.97 9.13 10.81 9.28 10.66C9.42 10.52 9.58 10.31 9.73 10.14C9.88 9.97 9.93 9.84 10.03 9.64C10.13 9.44 10.08 9.27 10.01 9.12C9.93 8.97 9.33 7.51 9.09 6.91C8.84 6.33 8.6 6.41 8.42 6.4C8.25 6.39 8.05 6.39 7.85 6.39C7.65 6.39 7.33 6.46 7.05 6.76C6.78 7.06 6 7.79 6 9.25C6 10.71 7.07 12.11 7.22 12.31C7.37 12.51 9.32 15.52 12.3 16.81C13.01 17.12 13.56 17.3 13.99 17.44C14.7 17.67 15.35 17.63 15.86 17.56C16.43 17.47 17.62 16.84 17.87 16.14C18.12 15.44 18.12 14.85 18.04 14.73C17.97 14.6 17.77 14.53 17.47 14.38Z"
                  fill="#0D0D0D"
                />
              </svg>
              <span className="tracking-tight">Pedir por WhatsApp</span>
              <ArrowRight className="w-5 h-5 ml-0.5 text-cheesy-yellow transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>

            {/* 3 Cuñas doodle del lado derecho */}
            <div className="transition-all duration-300 ease-out group-hover:translate-x-3 sm:group-hover:translate-x-4 origin-left">
              <svg
                viewBox="0 0 54 60"
                fill="none"
                className="w-8 sm:w-11 h-10 sm:h-13 text-cheesy-black overflow-visible"
                aria-hidden="true"
              >
                {/* Cuña superior hacia arriba-derecha (↗) */}
                <g className="transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:translate-x-1.5">
                  <path
                    d="M 6 14 C 7 11 18 8 34 4 C 43 1.5 46 4 44 6 C 32 10 16 18 8 18 C 6 18 5 16 6 14 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
                {/* Cuña intermedia estrictamente horizontal hacia la derecha (→) */}
                <g className="transition-transform duration-300 ease-out group-hover:translate-x-2.5">
                  <path
                    d="M 6 27 C 8 27 20 28 46 28.5 C 49 28.5 49 31.5 46 31.5 C 20 32 8 33 6 33 C 4 33 4 27 6 27 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
                {/* Cuña inferior hacia abajo-derecha (↘) */}
                <g className="transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-1.5">
                  <path
                    d="M 6 46 C 5 44 6 42 8 42 C 16 42 32 50 44 54 C 46 56 43 58.5 34 56 C 18 52 7 49 6 46 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* Derecha: Redes sociales con contornos/iconos amarillos y separador idéntico al mockup */}
          <div className="flex items-center gap-3 sm:gap-4 md:border-l md:border-black/25 md:pl-8">
            <a
              href={SITE_CONFIG.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de CheesyBite"
              className="w-10 h-10 rounded-full bg-cheesy-black text-cheesy-yellow flex items-center justify-center hover:scale-110 hover:bg-[#1A1A1A] active:scale-95 transition-all shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href={SITE_CONFIG.socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook de CheesyBite"
              className="w-10 h-10 rounded-full bg-cheesy-black text-cheesy-yellow flex items-center justify-center hover:scale-110 hover:bg-[#1A1A1A] active:scale-95 transition-all shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href={SITE_CONFIG.socialLinks.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok de CheesyBite"
              className="w-10 h-10 rounded-full bg-cheesy-black text-cheesy-yellow flex items-center justify-center hover:scale-110 hover:bg-[#1A1A1A] active:scale-95 transition-all shadow-md"
            >
              <svg className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.87-4.49V8.62a8.2 8.2 0 0 0 4.9 1.6V6.76c-.33-.02-.67-.04-1-.07z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

      {/* Ondulación orgánica inferior continua y fluida con curva ascendente en ambas esquinas */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none -mt-px">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-12 lg:h-14 block text-cheesy-yellow"
          aria-hidden="true"
        >
          <path
            d="M 0,0 L 1440,0 L 1440,16 C 1200,44 960,60 720,60 C 480,60 240,44 0,16 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}


'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/data'
import { useInView } from '@/hooks/use-in-view'

const WORDMARK = ['DON', 'PANCHO']
// Inclinación con la que arranca cada letra antes de asentarse
const LEANS = [-7, 5, -4, 6, -5, 4, -6, 5, -4]

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { key: 'facebook', label: 'Facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { key: 'tiktok', label: 'TikTok', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.87-4.49V8.62a8.2 8.2 0 0 0 4.9 1.6V6.76c-.33-.02-.67-.04-1-.07z' },
] as const

const linkClass =
  'inline-block py-1 text-white underline-offset-4 decoration-2 transition-colors duration-200 hover:text-pancho-cream hover:underline cursor-pointer'

/**
 * Pie de página en papel bordó: cuatro columnas de enlaces y datos y, debajo, el nombre
 * «DON PANCHO» a todo el ancho con la etiqueta «& Burger» pegada en la punta.
 *
 * Las letras del nombre suben una por una cuando el pie entra en pantalla y saltan
 * al pasarles el mouse. El nombre gigante es decorativo: el nombre completo ya está
 * escrito en la última columna, así que va oculto para lectores de pantalla.
 * Estilos en app/globals.css, bajo «Pie».
 */
export function Footer() {
  const pathname = usePathname()
  const { ref, isInView } = useInView({ threshold: 0.35 })

  const handleNavClick = (e: React.MouseEvent, href: string, hashId?: string) => {
    if (pathname === '/') {
      if (hashId) {
        e.preventDefault()
        if (hashId === 'inicio') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          const el = document.getElementById(hashId)
          if (el) {
            const navHeight = 70
            const targetY = el.getBoundingClientRect().top + window.scrollY - navHeight
            window.scrollTo({ top: targetY, behavior: 'smooth' })
          }
        }
      }
    } else if (pathname === '/menu') {
      if (href === '/menu') {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  let letterIndex = -1

  return (
    <footer id="contacto" className="relative overflow-hidden bg-[#7a0b0b] bg-[url('/images/fondo-footer-bordo-oscuro.webp')] bg-cover bg-center text-pancho-cream">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Columnas */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 text-sm sm:py-16 md:grid-cols-4">
          <nav aria-label="Navegación del pie">
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Navegación</p>
            <ul className="mt-3">
              <li>
                <Link href="/" onClick={(e) => handleNavClick(e, '/', 'inicio')} className={linkClass}>
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/menu" onClick={(e) => handleNavClick(e, '/menu')} className={linkClass}>
                  Nuestro menú
                </Link>
              </li>
              <li>
                <Link
                  href="/#nosotros"
                  onClick={(e) => handleNavClick(e, '/#nosotros', 'nosotros')}
                  className={linkClass}
                >
                  Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/#contacto"
                  onClick={(e) => handleNavClick(e, '/#contacto', 'contacto')}
                  className={linkClass}
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Carta">
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Carta</p>
            <ul className="mt-3">
              <li>
                <Link href="/menu?categoria=hamburguesas" className={linkClass}>
                  Hamburguesas
                </Link>
              </li>
              <li>
                <Link href="/menu?categoria=panchos" className={linkClass}>
                  Panchos
                </Link>
              </li>
              <li>
                <Link href="/menu" onClick={(e) => handleNavClick(e, '/menu')} className={linkClass}>
                  Toda la carta
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Dónde y cuándo</p>
            <p className="mt-3 py-1 text-white">{SITE_CONFIG.address}</p>
            <p className="py-1 text-white">{SITE_CONFIG.schedule}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em]">{SITE_CONFIG.name}</p>
            <p className="mt-3 py-1 text-white">© {new Date().getFullYear()} {SITE_CONFIG.name}</p>
            <p className="py-1 text-white">Todos los derechos reservados</p>
            <div className="mt-3 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.key}
                  href={SITE_CONFIG.socialLinks[social.key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${social.label} de ${SITE_CONFIG.name}`}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-pancho-cream text-pancho-red-deep transition-transform duration-200 ease-(--ease-out) hover:-translate-y-1 active:scale-[0.97]"
                >
                  <svg aria-hidden="true" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Nombre a todo el ancho */}
        <div
          ref={ref}
          data-inview={isInView}
          aria-hidden="true"
          className="footer-mark-box border-t border-pancho-cream/35 pt-5 sm:pt-8"
        >
          <div className="footer-mark text-pancho-cream">
            {WORDMARK.map((word, wordIndex) => (
              <React.Fragment key={word}>
                {wordIndex > 0 ? <span className="footer-mark__gap" /> : null}
                {Array.from(word).map((char) => {
                  letterIndex += 1
                  return (
                    <span
                      key={`${word}-${letterIndex}`}
                      className="footer-mark__char"
                      style={
                        {
                          '--i': letterIndex,
                          '--lean': `${LEANS[letterIndex % LEANS.length]}deg`,
                        } as React.CSSProperties
                      }
                    >
                      {char}
                    </span>
                  )
                })}
              </React.Fragment>
            ))}

            {/* Etiqueta pegada sobre la última letra */}
            <span className="absolute right-0 top-[4%] -rotate-6">
              <span
                style={{ '--d': '650ms' } as React.CSSProperties}
                className="rv-slap block bg-pancho-white px-[0.5em] py-[0.18em] font-sans text-[max(13px,3.1cqw)] font-extrabold leading-[1.1] tracking-[0.02em] text-pancho-red-deep shadow-lg"
              >
                & Burger
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

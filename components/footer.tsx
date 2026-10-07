'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/data'
import { useInView } from '@/hooks/use-in-view'

const WORDMARK = ['DON', 'PANCHO']
// Inclinación con la que arranca cada letra antes de asentarse
const LEANS = [-7, 5, -4, 6, -5, 4, -6, 5, -4]

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
    <footer className="relative overflow-hidden bg-pancho-red-deep bg-[url('/images/fondo-footer-bordo.webp')] bg-cover bg-center text-pancho-cream">
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

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/data'

export function Footer() {
  const pathname = usePathname()

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

  return (
    <footer className="bg-pancho-black py-8 px-4 sm:px-6 lg:px-8 text-neutral-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Accesos rápidos de navegación */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, '/', 'inicio')}
            className="hover:text-pancho-orange transition-colors cursor-pointer"
          >
            Inicio
          </Link>
          <Link
            href="/menu"
            onClick={(e) => handleNavClick(e, '/menu')}
            className="hover:text-pancho-orange transition-colors cursor-pointer"
          >
            Nuestro Menú
          </Link>
          <Link
            href="/#nosotros"
            onClick={(e) => handleNavClick(e, '/#nosotros', 'nosotros')}
            className="hover:text-pancho-orange transition-colors cursor-pointer"
          >
            Nosotros
          </Link>
          <Link
            href="/#contacto"
            onClick={(e) => handleNavClick(e, '/#contacto', 'contacto')}
            className="hover:text-pancho-orange transition-colors cursor-pointer"
          >
            Contacto
          </Link>
        </div>

        {/* Información del local y derechos */}
        <div className="text-center sm:text-right text-neutral-500 text-xs">
          <p>{SITE_CONFIG.address} · {SITE_CONFIG.schedule}</p>
          <p className="mt-1">{SITE_CONFIG.name} © {new Date().getFullYear()} | Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { Logo } from './logo'

interface NavbarProps {
  cartCount: number
  onOpenCart: () => void
}

export function Navbar({ cartCount, onOpenCart }: NavbarProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartBadgeAnimate, setCartBadgeAnimate] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  const navLinksRef = useRef<(HTMLAnchorElement | null)[]>([])

  const navLinks = [
    { label: 'Inicio', href: '/#inicio', key: 'inicio' },
    { label: 'Nuestro Menú', href: '/menu', key: 'menu' },
    { label: 'Nosotros', href: '/#nosotros', key: 'nosotros' },
    { label: 'Contacto', href: '/#contacto', key: 'contacto' },
  ]

  const isLinkActive = (linkKey: string) => {
    if (pathname === '/menu') return linkKey === 'menu'
    return linkKey === activeSection
  }

  // Actualizar la posición y ancho del indicador subrayado al cambiar de página o sección
  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = navLinks.findIndex((link) => {
        if (pathname === '/menu') return link.key === 'menu'
        return link.key === activeSection
      })
      const currentEl = navLinksRef.current[activeIndex]
      if (currentEl) {
        setIndicatorStyle({
          left: currentEl.offsetLeft,
          width: currentEl.offsetWidth,
          opacity: 1,
        })
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [pathname, activeSection])

  // Scroll spy para detectar la sección activa en la home y aplicar sombra al header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      if (pathname === '/menu') return

      const sectionIds = ['contacto', 'nosotros', 'menu', 'inicio']
      const scrollPosition = window.scrollY + 140

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        setActiveSection('contacto')
        return
      }

      for (const id of sectionIds) {
        const section = document.getElementById(id)
        if (section) {
          const top = section.offsetTop
          if (scrollPosition >= top) {
            setActiveSection(id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  useEffect(() => {
    if (cartCount > 0) {
      setCartBadgeAnimate(true)
      const timer = setTimeout(() => setCartBadgeAnimate(false), 300)
      return () => clearTimeout(timer)
    }
  }, [cartCount])

  // Desplazamiento automático y suave a la sección al navegar desde otra página con hash (#nosotros, #contacto, etc.)
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        const id = hash.replace('#', '')
        const timer = setTimeout(() => {
          const el = document.getElementById(id)
          if (el) {
            const navHeight = 70
            const targetY = el.getBoundingClientRect().top + window.scrollY - navHeight
            window.scrollTo({ top: targetY, behavior: 'smooth' })
          }
        }, 150)
        return () => clearTimeout(timer)
      }
    }
  }, [pathname])

  const handleLinkClick = (e: React.MouseEvent, link: (typeof navLinks)[number]) => {
    if (link.key === 'menu') {
      if (pathname === '/menu') {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    // Si estamos en la home, hacemos smooth scroll a la sección
    if (pathname === '/') {
      e.preventDefault()
      setActiveSection(link.key)
      const el = document.getElementById(link.key)
      if (el) {
        const navHeight = 70
        const targetY = el.getBoundingClientRect().top + window.scrollY - navHeight
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding,box-shadow] duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-cheesy-black/95 backdrop-blur-md border-b border-neutral-800/80 py-2 shadow-xl shadow-black/40'
          : 'bg-linear-to-b from-cheesy-black/90 via-cheesy-black/50 to-transparent py-2.5 sm:py-3'
      }`}
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="shrink-0">
            <Logo variant="nav" />
          </div>

          {/* Enlaces de navegación en escritorio */}
          <nav className="relative hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  navLinksRef.current[idx] = el
                }}
                onClick={(e) => handleLinkClick(e, link)}
                className={`relative py-1 transition-colors duration-200 cursor-pointer ${
                  isLinkActive(link.key)
                    ? 'text-white font-semibold'
                    : 'text-[#DEDED9] hover:text-cheesy-yellow'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Subrayado amarillo deslizante */}
            <span
              className="absolute bottom-0 h-0.5 bg-cheesy-yellow rounded-full transition-all duration-300 ease-out pointer-events-none shadow-[0_0_8px_rgba(245,185,0,0.5)]"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />
          </nav>

          {/* Acciones: Carrito y botón de menú mobile */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full border border-neutral-700 bg-neutral-900/60 hover:border-cheesy-yellow text-white transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
              aria-label={`Ver carrito de compras, ${cartCount} productos`}
            >
              <ShoppingCart className="w-5 h-5 transition-transform group-hover:rotate-6 text-cheesy-cream" />
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-cheesy-yellow text-cheesy-black font-bold text-xs rounded-full flex items-center justify-center font-display transition-transform ${
                  cartBadgeAnimate ? 'scale-125' : 'scale-100'
                }`}
              >
                {cartCount}
              </span>
            </button>

            {/* Botón de menú mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable para mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-cheesy-black/95 backdrop-blur-md px-6 py-5 shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4 text-base font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleLinkClick(e, link)
                  setMobileMenuOpen(false)
                }}
                className={`py-2 border-b border-neutral-800/60 last:border-b-0 transition-colors cursor-pointer ${
                  isLinkActive(link.key)
                    ? 'text-cheesy-yellow font-bold'
                    : 'text-neutral-200 hover:text-cheesy-yellow'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

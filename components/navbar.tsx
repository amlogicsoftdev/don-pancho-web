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

const navLinks = [
  { label: 'Inicio', href: '/#inicio', key: 'inicio' },
  { label: 'Nuestro Menú', href: '/menu', key: 'menu' },
  { label: 'Nosotros', href: '/#nosotros', key: 'nosotros' },
  { label: 'Contacto', href: '/#contacto', key: 'contacto' },
]

export function Navbar({ cartCount, onOpenCart }: NavbarProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartBadgeAnimate, setCartBadgeAnimate] = useState(false)
  const [prevCartCount, setPrevCartCount] = useState(cartCount)
  const [activeSection, setActiveSection] = useState('inicio')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  const navLinksRef = useRef<(HTMLAnchorElement | null)[]>([])

  // Pulso del contador del carrito: se activa durante el render al cambiar la cantidad
  // (patrón recomendado por React en vez de un setState dentro de un efecto)
  if (cartCount !== prevCartCount) {
    setPrevCartCount(cartCount)
    if (cartCount > 0) setCartBadgeAnimate(true)
  }

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
    if (!cartBadgeAnimate) return
    const timer = setTimeout(() => setCartBadgeAnimate(false), 300)
    return () => clearTimeout(timer)
  }, [cartBadgeAnimate, cartCount])

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

  // El inicio es claro: la barra va transparente sobre el papel naranja y, al scrollear,
  // en papel crema; en los dos casos el texto y los controles van en negro.
  // La carta es oscura: ahí la barra sigue oscura.
  const isHome = pathname === '/'
  const solid = isScrolled || mobileMenuOpen

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
      className={`nav-in fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding,box-shadow] duration-300 ${
        isHome
          ? solid
            ? 'bg-pancho-paper/90 backdrop-blur-md border-b border-black/10 py-2 shadow-[0_10px_30px_-18px_rgb(0_0_0/0.45)]'
            : 'bg-transparent border-b border-transparent py-2.5 sm:py-3'
          : solid
            ? 'bg-pancho-black/95 backdrop-blur-md border-b border-neutral-800/80 py-2 shadow-xl shadow-black/40'
            : 'bg-linear-to-b from-pancho-black/90 via-pancho-black/50 to-transparent py-2.5 sm:py-3'
      }`}
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="shrink-0">
            <Logo variant="nav" />
          </div>

          {/* Enlaces de navegación en escritorio */}
          <nav className="relative hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-[0.06em]">
            {navLinks.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  navLinksRef.current[idx] = el
                }}
                onClick={(e) => handleLinkClick(e, link)}
                className={`relative py-1 transition-colors duration-200 cursor-pointer ${
                  isHome
                    ? solid
                      ? 'text-pancho-black hover:text-pancho-red-deep'
                      : 'text-pancho-black'
                    : isLinkActive(link.key)
                      ? 'text-white'
                      : 'text-neutral-200 hover:text-pancho-orange'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Subrayado deslizante: negro sobre el naranja, rojo sobre el papel crema, naranja sobre el fondo oscuro */}
            <span
              className={`absolute bottom-0 h-0.5 transition-[left,width,opacity,background-color] duration-300 ease-out pointer-events-none ${
                isHome ? (solid ? 'bg-pancho-red-deep' : 'bg-pancho-black') : 'bg-pancho-orange'
              }`}
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
              className={`relative p-2.5 rounded-full border text-white transition-[transform,border-color,background-color] duration-200 ease-out active:scale-[0.97] group cursor-pointer ${
                isHome
                  ? 'border-pancho-black bg-pancho-black'
                  : 'border-neutral-700 bg-neutral-900/60 hover:border-pancho-orange'
              }`}
              aria-label={`Ver carrito de compras, ${cartCount} productos`}
            >
              <ShoppingCart className="w-5 h-5 transition-transform group-hover:rotate-6 text-white" />
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 font-sans font-extrabold text-xs rounded-full flex items-center justify-center transition-transform ${
                  isHome ? 'bg-white text-pancho-red-deep ring-2 ring-pancho-black' : 'bg-pancho-orange text-pancho-black'
                } ${cartBadgeAnimate ? 'scale-125' : 'scale-100'}`}
              >
                {cartCount}
              </span>
            </button>

            {/* Botón de menú mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                isHome
                  ? 'text-pancho-black hover:bg-black/10'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable para mobile */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden px-6 py-5 animate-in fade-in slide-in-from-top-4 duration-200 ${
            isHome ? '' : 'bg-pancho-black/95 backdrop-blur-md shadow-2xl'
          }`}
        >
          <nav className="flex flex-col gap-4 text-base font-bold uppercase tracking-[0.06em]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleLinkClick(e, link)
                  setMobileMenuOpen(false)
                }}
                className={`py-2 border-b last:border-b-0 transition-colors cursor-pointer ${
                  isHome
                    ? `border-black/10 ${isLinkActive(link.key) ? 'text-pancho-red-deep' : 'text-pancho-black hover:text-pancho-red-deep'}`
                    : `border-neutral-800/60 ${isLinkActive(link.key) ? 'text-pancho-orange' : 'text-neutral-200 hover:text-pancho-orange'}`
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

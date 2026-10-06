'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Check } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { PRODUCTS, CATEGORIES, formatPrice } from '@/lib/data'
import { Product, CategoryFilter } from '@/lib/types'
import { useCart } from '@/lib/cart'
import { useMounted } from '@/hooks/use-mounted'

// Siluetas SVG de queso cheddar derretido con ondulaciones y caídas profundas bien marcadas
const CHEDDAR_PATHS: Record<string, string> = {
  Todas:
    'M 14,5 C 40,2 70,6 96,2 C 112,6 119,10 120,22 C 120,32 115,35 104,36 C 94,36 90,47 80,47 C 72,47 68,36 58,36 C 50,36 46,46 36,46 C 28,46 24,37 16,40 C 10,43 5,37 2,30 C 0,20 1,12 5,6 C 8,2 11,5 14,5 Z',
  Clásicas:
    'M 12,4 C 36,7 66,2 92,6 C 108,4 116,8 118,18 C 120,28 116,34 106,35 C 98,35 94,46 86,46 C 78,46 74,35 64,35 C 56,35 52,47 42,47 C 34,47 30,36 20,42 C 14,46 8,39 3,32 C -1,22 1,10 5,5 C 8,2 10,3 12,4 Z',
  Especiales:
    'M 15,5 C 42,2 72,6 95,3 C 110,2 117,8 119,16 C 120,26 116,33 108,35 C 98,35 92,47 82,47 C 74,47 70,36 60,36 C 52,36 48,47 36,47 C 28,47 24,36 14,41 C 8,44 4,37 1,28 C 0,16 2,8 6,4 C 9,2 12,4 15,5 Z',
  Vegetarianas:
    'M 14,4 C 44,2 78,6 104,3 C 116,3 120,12 118,22 C 116,33 110,35 98,35 C 90,35 84,47 74,47 C 64,47 60,35 48,35 C 38,35 32,47 22,47 C 14,47 9,39 4,35 C 0,28 0,14 3,7 C 6,2 10,3 14,4 Z',
  Combos:
    'M 16,4 C 42,6 76,2 102,4 C 115,5 119,14 117,24 C 114,34 106,35 94,35 C 84,35 78,47 68,47 C 58,47 54,36 44,36 C 34,36 28,47 18,47 C 10,47 5,39 2,33 C -1,22 1,10 5,5 C 8,2 12,3 16,4 Z',
}

// Partículas radiales suaves para la explosión al cambiar de filtro (sin líneas bruscas)
const FILTER_EXPLOSION_PARTICLES = [
  { x: 0, y: -28, size: 5, delay: 0 },
  { x: 22, y: -20, size: 5, delay: 30 },
  { x: 38, y: -8, size: 4, delay: 15 },
  { x: 44, y: 0, size: 5, delay: 45 },
  { x: 38, y: 8, size: 4, delay: 20 },
  { x: 22, y: 20, size: 5, delay: 50 },
  { x: 0, y: 28, size: 5, delay: 10 },
  { x: -22, y: 20, size: 5, delay: 35 },
  { x: -38, y: 8, size: 4, delay: 25 },
  { x: -44, y: 0, size: 5, delay: 45 },
  { x: -38, y: -8, size: 4, delay: 15 },
  { x: -22, y: -20, size: 5, delay: 40 },
  { x: 14, y: -30, size: 4, delay: 60 },
  { x: -14, y: -30, size: 4, delay: 60 },
  { x: 14, y: 30, size: 4, delay: 70 },
  { x: -14, y: 30, size: 4, delay: 70 },
]

// Partículas amarillas con amplia dispersión radial al agregar al carrito
const BURST_PARTICLES = [
  { x: 0, y: -52, size: 6, delay: 0 },
  { x: 38, y: -38, size: 7, delay: 15 },
  { x: 55, y: 0, size: 6, delay: 0 },
  { x: 38, y: 38, size: 7, delay: 25 },
  { x: 0, y: 55, size: 6, delay: 0 },
  { x: -38, y: 38, size: 7, delay: 15 },
  { x: -55, y: 0, size: 6, delay: 0 },
  { x: -38, y: -38, size: 7, delay: 25 },
  { x: 22, y: -58, size: 5, delay: 35 },
  { x: 58, y: -22, size: 5, delay: 20 },
  { x: 58, y: 22, size: 5, delay: 30 },
  { x: 22, y: 58, size: 5, delay: 35 },
  { x: -22, y: 58, size: 5, delay: 20 },
  { x: -58, y: -22, size: 5, delay: 30 },
]

// Ángulos de rotación orgánicos únicos para cada plato (grados numéricos exactos)
const ROTATION_ANGLES: Record<number, number> = {
  1: -2.8,
  2: 2.6,
  3: -1.8,
  4: 3.2,
  5: -3.0,
  6: 2.4,
  7: -2.2,
  8: 2.0,
}

export default function MenuPage() {
  const { cart, totalCartCount, handleAddToCart, handleUpdateQuantity, handleRemoveItem } = useCart()
  const mounted = useMounted()
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Todas')
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null)
  const [activePhotoProduct, setActivePhotoProduct] = useState<Product>(PRODUCTS[0])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [justAddedId, setJustAddedId] = useState<number | null>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const [explodingCategory, setExplodingCategory] = useState<CategoryFilter | null>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const animRef = useRef<Animation | null>(null)

  // Detección de scroll horizontal para los degradés de aviso en los filtros mobile
  useEffect(() => {
    const el = filterContainerRef.current
    if (!el) return

    const updateScrollGradients = () => {
      setCanScrollLeft(el.scrollLeft > 6)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6)
    }

    updateScrollGradients()
    const timer = setTimeout(updateScrollGradients, 100)
    el.addEventListener('scroll', updateScrollGradients, { passive: true })
    window.addEventListener('resize', updateScrollGradients)

    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', updateScrollGradients)
      window.removeEventListener('resize', updateScrollGradients)
    }
  }, [mounted])

  // Sincronización de posición del indicador en carga inicial y redimensionamiento
  useEffect(() => {
    const updateIndicatorPosition = () => {
      const btn = buttonRefs.current[activeCategory]
      const indicator = indicatorRef.current
      if (btn && indicator && !animRef.current) {
        indicator.style.left = `${btn.offsetLeft - 4}px`
        indicator.style.width = `${btn.offsetWidth + 8}px`
        indicator.style.top = `${btn.offsetTop - 2}px`
        indicator.style.height = `${btn.offsetHeight + 8}px`
        indicator.style.transform = 'none'
        indicator.style.opacity = '1'
      }
    }

    updateIndicatorPosition()
    window.addEventListener('resize', updateIndicatorPosition)
    return () => window.removeEventListener('resize', updateIndicatorPosition)
  }, [activeCategory, mounted])

  const handleCategoryClick = (category: CategoryFilter) => {
    if (category === activeCategory) return
    const fromCategory = activeCategory
    const fromButton = buttonRefs.current[fromCategory]
    const toButton = buttonRefs.current[category]
    const indicator = indicatorRef.current
    const container = filterContainerRef.current

    setActiveCategory(category)

    if (toButton) {
      toButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }

    if (!toButton || !indicator || !container) return

    // Posición inicial: si ya había animación activa, tomamos coordenadas vivas del DOM
    let startLeft = fromButton ? fromButton.offsetLeft - 4 : toButton.offsetLeft - 4
    let startWidth = fromButton ? fromButton.offsetWidth + 8 : toButton.offsetWidth + 8
    const startTop = fromButton ? fromButton.offsetTop - 2 : toButton.offsetTop - 2
    const startHeight = fromButton ? fromButton.offsetHeight + 8 : toButton.offsetHeight + 8

    if (animRef.current) {
      const containerRect = container.getBoundingClientRect()
      const indicatorRect = indicator.getBoundingClientRect()
      startLeft = indicatorRect.left - containerRect.left
      startWidth = indicatorRect.width
      animRef.current.cancel()
    }

    const targetLeft = toButton.offsetLeft - 4
    const targetWidth = toButton.offsetWidth + 8
    const targetTop = toButton.offsetTop - 2
    const targetHeight = toButton.offsetHeight + 8

    // Desplazamiento ultra suave, fluido y continuo sin compresiones bruscas
    const anim = indicator.animate(
      [
        {
          left: `${startLeft}px`,
          width: `${startWidth}px`,
          top: `${startTop}px`,
          height: `${startHeight}px`,
        },
        {
          left: `${targetLeft}px`,
          width: `${targetWidth}px`,
          top: `${targetTop}px`,
          height: `${targetHeight}px`,
        },
      ],
      {
        duration: 380,
        easing: 'cubic-bezier(0.25, 1, 0.35, 1)',
        fill: 'forwards',
      }
    )

    animRef.current = anim

    // Disparo suave de las partículas en sintonía con el arribo fluido
    const explosionTimer = setTimeout(() => {
      setExplodingCategory(category)
      setTimeout(() => setExplodingCategory(null), 600)
    }, 180)

    anim.onfinish = () => {
      clearTimeout(explosionTimer)
      indicator.style.left = `${targetLeft}px`
      indicator.style.width = `${targetWidth}px`
      indicator.style.top = `${targetTop}px`
      indicator.style.height = `${targetHeight}px`
      indicator.style.transform = 'none'
      anim.cancel()
      animRef.current = null
    }
  }

  const filteredProducts = activeCategory === 'Todas'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory)

  const handleAddProduct = (product: Product) => {
    handleAddToCart(product)
    setJustAddedId(product.id)
    setTimeout(() => setJustAddedId(null), 900)
  }

  return (
    <div className="min-h-screen bg-cheesy-black text-cheesy-cream selection:bg-cheesy-yellow selection:text-cheesy-black flex flex-col justify-between">
      {/* Navbar con carrito sincronizado */}
      <Navbar cartCount={totalCartCount} onOpenCart={() => setCartOpen(true)} />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        {/* Navegación superior */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-cheesy-yellow transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Volver a la página principal</span>
          </Link>
        </div>

        {/* Encabezado */}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-white">
            Nuestro <span className="text-cheesy-yellow">Menú</span>
          </h1>
        </header>

        {/* Selector de categorías al estilo CheesyBite con indicador de queso cheddar derretido */}
        <div className="mb-12 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            {/* Degradé indicador izquierdo (avisa que hay más filtros a la izquierda al scrollear) */}
            <div
              aria-hidden="true"
              className={`absolute left-0 top-0 bottom-0 w-8 sm:w-10 pointer-events-none z-20 transition-opacity duration-300 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'linear-gradient(to right, #0D0D0D 20%, rgba(13, 13, 13, 0) 100%)',
              }}
            />

            {/* Degradé indicador derecho (avisa que hay más filtros a la derecha al scrollear) */}
            <div
              aria-hidden="true"
              className={`absolute right-0 top-0 bottom-0 w-8 sm:w-10 pointer-events-none z-20 transition-opacity duration-300 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'linear-gradient(to left, #0D0D0D 20%, rgba(13, 13, 13, 0) 100%)',
              }}
            />

            <div
              ref={filterContainerRef}
              role="tablist"
              aria-label="Categorías del menú"
              className="relative flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-2 w-full"
            >
              {/* Fondo activo con forma artesanal realista de queso cheddar derretido */}
              <div
                ref={indicatorRef}
                aria-hidden="true"
                className="absolute pointer-events-none z-0 transition-opacity duration-300"
                style={{ opacity: 0 }}
              >
                <svg
                  viewBox="0 0 120 48"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <path
                    d={CHEDDAR_PATHS[activeCategory] ?? CHEDDAR_PATHS.Todas}
                    fill="#F5B900"
                  />
                </svg>
              </div>

              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category
                const isExploding = explodingCategory === category
                return (
                  <button
                    key={category}
                    ref={(el) => {
                      buttonRefs.current[category] = el
                    }}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleCategoryClick(category)}
                    className={`relative z-10 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                      isActive
                        ? 'text-cheesy-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {/* Explosión suave de partículas amarillas de cheddar al activarse */}
                    {isExploding && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                        {FILTER_EXPLOSION_PARTICLES.map((p, i) => (
                          <span
                            key={i}
                            className="absolute rounded-full bg-cheesy-yellow animate-particle shadow-[0_0_8px_#F5B900]"
                            style={{
                              width: `${p.size}px`,
                              height: `${p.size}px`,
                              '--tx': `${p.x}px`,
                              '--ty': `${p.y}px`,
                              animationDelay: `${p.delay}ms`,
                            } as React.CSSProperties}
                          />
                        ))}
                      </div>
                    )}

                    <span className="relative z-10">{category}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Layout Principal: Carta tradicional centrada sin columna fija */}
        <div className="max-w-3xl mx-auto w-full divide-y divide-neutral-800/60 relative">
          {filteredProducts.map((product) => {
            const isHovered = hoveredProduct?.id === product.id
            return (
              <article
                key={product.id}
                onMouseEnter={(e) => {
                  setHoveredProduct(product)
                  setActivePhotoProduct(product)
                  setMousePos({ x: e.clientX, y: e.clientY })
                }}
                onMouseMove={(e) => {
                  setMousePos({ x: e.clientX, y: e.clientY })
                }}
                onMouseLeave={() => setHoveredProduct(null)}
                className="group py-4 px-2 sm:px-4 transition-colors duration-200 hover:bg-neutral-900/30 rounded-xl cursor-default"
              >
                {/* =========================================
                    VISTA MOBILE (lg:hidden): Bento horizontal con foto y borde cheddar
                    ========================================= */}
                <div className="flex items-center justify-between gap-3.5 lg:hidden">
                  {/* Información a la izquierda */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display font-bold text-lg text-white group-hover:text-cheesy-yellow transition-colors leading-tight">
                        {product.name}
                      </h2>
                      {product.badge && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cheesy-yellow text-cheesy-black font-display tracking-wider">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-display font-black text-lg text-cheesy-yellow tracking-tight">
                        {formatPrice(product.price)}
                      </span>

                      {/* Botón interactivo de agregar */}
                      <div className="relative flex items-center justify-center">
                        {justAddedId === product.id && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            {BURST_PARTICLES.map((p, i) => (
                              <span
                                key={i}
                                className="absolute rounded-full bg-cheesy-yellow animate-particle shadow-[0_0_8px_#F5B900]"
                                style={{
                                  width: `${p.size}px`,
                                  height: `${p.size}px`,
                                  '--tx': `${p.x}px`,
                                  '--ty': `${p.y}px`,
                                  animationDelay: `${p.delay}ms`,
                                } as React.CSSProperties}
                              />
                            ))}
                            <span className="absolute -inset-1.5 rounded-full border-2 border-cheesy-yellow/80 animate-ping pointer-events-none" />
                          </div>
                        )}

                        <button
                          onClick={() => handleAddProduct(product)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md group/btn relative z-10 ${
                            justAddedId === product.id
                              ? 'bg-cheesy-yellow text-cheesy-black scale-110 shadow-[0_0_20px_rgba(245,185,0,0.5)]'
                              : 'bg-neutral-900 border border-neutral-700/80 text-neutral-300 hover:border-cheesy-yellow hover:bg-cheesy-yellow hover:text-cheesy-black active:scale-95'
                          }`}
                          aria-label={`Agregar ${product.name} al carrito`}
                        >
                          {justAddedId === product.id ? (
                            <Check className="w-4 h-4 stroke-3 animate-pop text-cheesy-black" />
                          ) : (
                            <Plus className="w-4 h-4 stroke-2.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Foto a la derecha estilo Polaroid artesanal con cinta masking tape (idéntica a desktop) */}
                  <div className="shrink-0 relative w-20 sm:w-24 pt-2.5">
                    <div
                      className="relative bg-cheesy-card p-1.5 pb-2.5 rounded-xs shadow-[0_10px_25px_rgba(0,0,0,0.85)] border border-[#2E2E2E] transition-transform duration-300 group-hover:scale-105"
                      style={{
                        transform: `rotate(${ROTATION_ANGLES[product.id] ?? 2}deg)`,
                      }}
                    >
                      {/* Cinta masking tape realista con bordes rasgados a mano y textura crepé */}
                      <div
                        aria-hidden="true"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 sm:w-14 h-4.5 z-20 pointer-events-none select-none"
                        style={{
                          filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6))',
                        }}
                      >
                        <div
                          className="w-full h-full backdrop-blur-[1px] border-t border-white/40 border-b"
                          style={{
                            background: `repeating-linear-gradient(
                              115deg,
                              rgba(240, 232, 210, 0.9),
                              rgba(240, 232, 210, 0.9) 2px,
                              rgba(228, 217, 192, 0.9) 3px,
                              rgba(240, 232, 210, 0.9) 5px
                            )`,
                            clipPath: `polygon(
                              0% 15%, 3% 0%, 1% 25%, 4% 45%, 1% 65%, 4% 85%, 0% 100%,
                              96% 100%, 100% 80%, 97% 60%, 100% 40%, 96% 20%, 99% 5%, 95% 0%
                            )`,
                            transform: 'rotate(-2deg)',
                          }}
                        />
                      </div>

                      {/* Contenedor de la foto */}
                      <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden rounded-xs border border-neutral-800/80">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================
                    VISTA DESKTOP (hidden lg:block): Fila clásica con línea punteada
                    ========================================= */}
                <div className="hidden lg:block">
                  <div className="flex items-baseline justify-between gap-4">
                    {/* Nombre y etiqueta destacada */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <h2
                        className={`font-display font-bold text-2xl transition-colors ${
                          isHovered ? 'text-cheesy-yellow' : 'text-white group-hover:text-cheesy-yellow'
                        }`}
                      >
                        {product.name}
                      </h2>
                      {product.badge && (
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-cheesy-yellow text-cheesy-black font-display tracking-wider">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Línea punteada tradicional */}
                    <div
                      className={`flex-1 mx-4 border-b-2 border-dotted self-baseline mb-1.5 transition-colors ${
                        isHovered ? 'border-cheesy-yellow/60' : 'border-neutral-700/60 group-hover:border-cheesy-yellow/40'
                      }`}
                    />

                    {/* Precio y Botón circular interactivo con explosión de partículas */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-display font-black text-2xl text-cheesy-yellow tracking-tight">
                        {formatPrice(product.price)}
                      </span>

                      <div className="relative flex items-center justify-center">
                        {justAddedId === product.id && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            {BURST_PARTICLES.map((p, i) => (
                              <span
                                key={i}
                                className="absolute rounded-full bg-cheesy-yellow animate-particle shadow-[0_0_8px_#F5B900]"
                                style={{
                                  width: `${p.size}px`,
                                  height: `${p.size}px`,
                                  '--tx': `${p.x}px`,
                                  '--ty': `${p.y}px`,
                                  animationDelay: `${p.delay}ms`,
                                } as React.CSSProperties}
                              />
                            ))}
                            <span className="absolute -inset-1.5 rounded-full border-2 border-cheesy-yellow/80 animate-ping pointer-events-none" />
                          </div>
                        )}

                        <button
                          onClick={() => handleAddProduct(product)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md group/btn relative z-10 ${
                            justAddedId === product.id
                              ? 'bg-cheesy-yellow text-cheesy-black scale-110 shadow-[0_0_20px_rgba(245,185,0,0.5)]'
                              : 'bg-neutral-900 border border-neutral-700/80 text-neutral-300 hover:border-cheesy-yellow hover:bg-cheesy-yellow hover:text-cheesy-black hover:scale-105 active:scale-95'
                          }`}
                          aria-label={`Agregar ${product.name} al carrito`}
                        >
                          {justAddedId === product.id ? (
                            <Check className="w-5 h-5 stroke-3 animate-pop text-cheesy-black" />
                          ) : (
                            <Plus className="w-5 h-5 stroke-2.5 transition-transform duration-200 group-hover/btn:rotate-90" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Descripción de los ingredientes */}
                  <p className="mt-1 text-sm text-neutral-400 font-normal leading-relaxed max-w-xl pr-4">
                    {product.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        {/* =========================================================
            Fotografía Flotante Dinámica con Rotación Suave (Desktop)
        ========================================================= */}
        {mounted && (
          <div
            aria-hidden="true"
            className="hidden lg:block pointer-events-none fixed top-0 left-0 z-50 select-none"
            style={{
              transform: `translate3d(${
                mousePos.x > window.innerWidth - 300
                  ? mousePos.x - 275
                  : mousePos.x + 28
              }px, ${Math.max(90, Math.min(window.innerHeight - 340, mousePos.y - 130))}px, 0)`,
              transition: 'transform 120ms ease-out',
              willChange: 'transform',
            }}
          >
            <div
              className="relative w-64 bg-cheesy-card p-2.5 pb-3.5 rounded-xs shadow-[0_30px_70px_rgba(0,0,0,0.95)] border border-[#2E2E2E] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                opacity: hoveredProduct ? 1 : 0,
                transform: hoveredProduct
                  ? `translateY(0px) scale(1) rotate(${ROTATION_ANGLES[activePhotoProduct.id] ?? 2}deg)`
                  : 'translateY(24px) scale(0.75) rotate(-7deg)',
              }}
            >
              {/* Cinta masking tape realista con bordes rasgados a mano y textura crepé */}
              <div
                aria-hidden="true"
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 z-20 pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
                }}
              >
                <div
                  className="w-full h-full backdrop-blur-[1px] border-t border-white/40 border-b"
                  style={{
                    background: `repeating-linear-gradient(
                      115deg,
                      rgba(240, 232, 210, 0.9),
                      rgba(240, 232, 210, 0.9) 2px,
                      rgba(228, 217, 192, 0.9) 3px,
                      rgba(240, 232, 210, 0.9) 5px
                    )`,
                    clipPath: `polygon(
                      0% 15%, 3% 0%, 1% 25%, 4% 45%, 1% 65%, 4% 85%, 0% 100%,
                      96% 100%, 100% 80%, 97% 60%, 100% 40%, 96% 20%, 99% 5%, 95% 0%
                    )`,
                    transform: 'rotate(-2deg)',
                  }}
                />
              </div>

              {/* Contenedor de la foto con crossfade y micro-zoom suave */}
              <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden rounded-xs border border-neutral-800/80">
                <Image
                  key={activePhotoProduct.id}
                  src={activePhotoProduct.image}
                  alt={activePhotoProduct.name}
                  fill
                  sizes="260px"
                  priority
                  className="object-cover animate-menu-photo"
                />
              </div>

              {/* Nombre del plato con fade suave al cambiar */}
              <div className="pt-2.5 text-center h-7 flex items-center justify-center">
                <h4
                  key={activePhotoProduct.id}
                  className="font-display font-black text-base text-white tracking-tight leading-none animate-menu-title"
                >
                  {activePhotoProduct.name}
                </h4>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Pie de página */}
      <Footer />

      {/* Carrito lateral desplegable */}
      <CartDrawer
        items={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  )
}

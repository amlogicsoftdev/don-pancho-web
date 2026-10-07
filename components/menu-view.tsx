'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { formatPrice } from '@/lib/data'
import { Category, Product, CategoryFilter } from '@/lib/types'
import { TODAS } from '@/lib/menu/categoria'
import { useCart } from '@/lib/cart'
import { useMounted } from '@/hooks/use-mounted'
import { SplitLines } from '@/components/split-lines'
import { FotoFlotante } from '@/components/foto-flotante'
import { ControlCantidad } from '@/components/control-cantidad'

interface MenuViewProps {
  /** Categorías activas, en orden (vienen de la base). */
  categories: Category[]
  /** Productos activos, en orden (vienen de la base). */
  products: Product[]
  /** Categoría con la que abre la carta; la define el parámetro `?categoria=` de la URL. */
  initialCategory?: CategoryFilter
}

const esCombo = (categoria: string) => /combo/i.test(categoria)
const esMasPedida = (product: Product) => /m[aá]s pedida/i.test(product.badge ?? '')

/**
 * Carta: título grande, categorías fijas arriba, la favorita de la casa, la lista a dos
 * columnas con línea punteada, los combos en un bloque de papel bordó y, abajo, la barra con el
 * pedido. Los productos, precios y categorías vienen de la base; el carrito es el de siempre.
 */
export function MenuView({ categories, products, initialCategory = TODAS }: MenuViewProps) {
  const {
    cart,
    totalCartCount,
    unavailableCount,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleUpdateNote,
    handleClearCart,
  } = useCart(products)
  const mounted = useMounted()
  // Alto real de la barra de navegación (cambia entre celular y escritorio y al scrollear):
  // las categorías quedan fijas justo debajo, sin dejar un hueco en el medio
  const [navHeight, setNavHeight] = useState(88)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory)
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null)

  useEffect(() => {
    const nav = document.querySelector('header')
    if (!nav) return
    const measure = () => setNavHeight(nav.offsetHeight)
    measure()
    // Al scrollear la barra cambia su relleno, no su contenido: hay que mirar la caja entera
    // (border-box); si no, el cambio no se avisa y queda un hueco arriba de los filtros
    const observer = new ResizeObserver(measure)
    observer.observe(nav, { box: 'border-box' })
    return () => observer.disconnect()
  }, [])

  const filterOptions: CategoryFilter[] = [TODAS, ...categories.map((c) => c.name)]
  const quantityOf = (id: number) => cart.find((item) => item.id === id)?.quantity ?? 0
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const isAll = activeCategory === TODAS
  const featured = isAll ? products.find(esMasPedida) : undefined
  const comboProducts = products.filter(
    (p) => esCombo(p.category) && (isAll || p.category === activeCategory),
  )
  const gridProducts = products.filter(
    (p) =>
      !esCombo(p.category) &&
      p.id !== featured?.id &&
      (isAll || p.category === activeCategory),
  )
  const countFor = (category: CategoryFilter) =>
    category === TODAS ? products.length : products.filter((p) => p.category === category).length
  const nothingToShow = !featured && gridProducts.length === 0 && comboProducts.length === 0

  const handleCategoryClick = (category: CategoryFilter) => {
    if (category === activeCategory) return
    setActiveCategory(category)
    setHoveredProduct(null)
    // La URL acompaña al filtro, así el enlace se puede compartir y «atrás» vuelve a la misma categoría
    window.history.replaceState(
      null,
      '',
      category === TODAS ? '/menu' : `/menu?categoria=${category.toLowerCase()}`,
    )
  }

  // Solo dice sobre qué plato está el mouse: la posición la sigue <FotoFlotante> por su cuenta,
  // así mover el mouse no vuelve a dibujar toda la carta
  const hoverProps = (product: Product) => ({
    onMouseEnter: () => setHoveredProduct(product),
    onMouseLeave: () => setHoveredProduct((actual) => (actual?.id === product.id ? null : actual)),
  })

  /** Botón cuadrado de agregar: cuando el producto ya está en el pedido se estira a −  n  + */
  const renderAdd = (product: Product) => (
    <ControlCantidad
      nombre={product.name}
      cantidad={quantityOf(product.id)}
      onAgregar={() => handleAddToCart(product)}
      onCambiar={(delta) => handleUpdateQuantity(product.id, delta)}
    />
  )

  /** Botón grande con dos bloques (texto + cruz), el de la favorita y el de los combos */
  const renderBigAdd = (product: Product, tone: 'orange' | 'black') => {
    const quantity = quantityOf(product.id)
    return (
      <button
        type="button"
        onClick={() => handleAddToCart(product)}
        className={`inline-flex cursor-pointer items-stretch transition-transform duration-200 ${
          tone === 'black'
            ? 'shadow-[6px_6px_0_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5'
            : 'hover:-translate-y-0.5'
        }`}
      >
        <span
          className="overflow-hidden bg-pancho-black px-5.5 py-4 text-[13px] font-extrabold uppercase tracking-[0.08em] text-white"
        >
          {/* La key hace que el texto nuevo entre deslizándose, como el número del + */}
          <span key={quantity} className="cantidad-texto block">
            {quantity > 0 ? `En tu pedido · ${quantity}` : 'Agregar al pedido'}
          </span>
        </span>
        <span
          className={`flex w-13.5 items-center justify-center ${
            tone === 'black' ? 'bg-white text-pancho-black' : 'bg-pancho-red-deep text-white'
          }`}
        >
          <Plus className="size-4.5 stroke-3" />
        </span>
      </button>
    )
  }

  return (
    <div className="page-menu flex min-h-screen flex-col justify-between bg-pancho-paper bg-[url('/images/fondo-secciones-crema.webp')] bg-cover bg-fixed bg-top text-pancho-black selection:bg-pancho-orange selection:text-pancho-black">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setCartOpen(true)} />

      <div className="flex-1 pb-28">
        {/* Encabezado */}
        <section className="mx-auto max-w-300 px-4 pt-28 sm:px-6 lg:px-10">
          <div className="load-fade" style={{ '--d': '100ms' } as React.CSSProperties}>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-pancho-black/70 transition-colors hover:text-pancho-red-deep"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Volver a la página principal</span>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <h1
              style={{ '--d': '150ms' } as React.CSSProperties}
              className="load-chars text-[clamp(56px,9vw,128px)] leading-[0.9] text-pancho-black"
            >
              <SplitLines lines={['Nuestro menú']} accentWords={['menú']} />
            </h1>
            <p
              style={{ '--d': '260ms' } as React.CSSProperties}
              className="load-up mb-2.5 max-w-[30ch] text-sm font-semibold leading-normal text-pancho-black/70"
            >
              Elegí lo que se te antoje y lo preparamos para vos.
            </p>
          </div>
        </section>

        {/* Categorías: quedan fijas debajo del encabezado al scrollear */}
        <div
          style={{ top: navHeight }}
          className="menu-filtros sticky z-20 mt-6 border-b-2 border-pancho-black bg-pancho-paper/95 backdrop-blur-sm sm:mt-10"
        >
          <div
            role="tablist"
            aria-label="Categorías del menú"
            className="mx-auto flex max-w-300 flex-wrap px-4 sm:px-6 lg:px-10"
          >
            {filterOptions.map((category) => {
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryClick(category)}
                  className={`flex flex-none cursor-pointer items-center gap-1.5 px-2.75 py-3.75 text-xs font-extrabold uppercase tracking-[0.06em] transition-colors duration-200 ${
                    isActive ? 'bg-pancho-orange text-pancho-black' : 'text-pancho-black/70 hover:text-pancho-black'
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`px-1.25 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-pancho-black/18' : 'bg-pancho-black/10'
                    }`}
                  >
                    {countFor(category)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <main
          key={activeCategory}
          className="mx-auto flex max-w-300 flex-col gap-10 px-4 pt-7 sm:gap-16 sm:px-6 sm:pt-12 lg:px-10"
        >
          {/* La favorita de la casa */}
          {featured && (
            <article
              className="menu-row grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] border-2 border-pancho-black bg-white bg-[url('/images/fondo-papel-blanco.webp')] bg-cover bg-center shadow-[8px_8px_0_var(--color-pancho-black)]"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <div className="relative aspect-4/3 overflow-hidden bg-neutral-900">
                <Image
                  src={featured.image}
                  alt={featured.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  priority
                  className="object-cover"
                />
                <span className="absolute left-0 top-4.5 bg-pancho-red-deep px-3.5 py-2 text-xs font-extrabold uppercase tracking-widest text-white">
                  ★ {featured.badge}
                </span>
              </div>
              <div className="flex flex-col justify-center gap-4.5 p-6 sm:p-12">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-pancho-red-deep">
                  La favorita de la casa
                </span>
                <h2 className="font-heading text-[clamp(44px,5.5vw,76px)] leading-[0.92]">{featured.name}</h2>
                <p className="max-w-[38ch] text-[15px] font-medium leading-relaxed text-pancho-black/80">
                  {featured.description}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-5">
                  <span className="font-heading text-[clamp(36px,4vw,48px)] leading-none text-pancho-red-deep">
                    {formatPrice(featured.price)}
                  </span>
                  {renderBigAdd(featured, 'orange')}
                </div>
              </div>
            </article>
          )}

          {/* Toda la carta, a dos columnas con línea punteada */}
          {gridProducts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {isAll && (
                <div className="mb-2 flex items-center gap-3.5">
                  <span className="font-heading text-[28px] uppercase">Toda la carta</span>
                  <span className="h-0.5 flex-1 bg-pancho-black" />
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,460px),1fr))] gap-x-14">
                {gridProducts.map((product, index) => (
                  <div
                    key={product.id}
                    {...hoverProps(product)}
                    style={{ '--i': index + 1 } as React.CSSProperties}
                    className="menu-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4.5 gap-y-1.5 border-b border-pancho-black/20 py-5 [@media(hover:none)]:grid-cols-[minmax(0,1fr)_auto] [@media(hover:none)]:items-start [@media(hover:none)]:gap-x-4"
                  >
                    {/* Sin mouse no hay foto que siga al puntero: va grande a la derecha de cada
                        plato, y el precio con el + pasa abajo de la descripción */}
                    <div className="foto-plato col-start-2 row-span-3 row-start-1 mt-1 hidden self-center [@media(hover:none)]:block">
                      <div className="relative size-26 overflow-hidden bg-neutral-900">
                        <Image src={product.image} alt="" fill sizes="104px" className="object-cover" />
                      </div>
                    </div>
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <h3 className="font-heading text-[clamp(22px,2vw,26px)] leading-[1.05]">{product.name}</h3>
                      {product.badge && (
                        <span className="flex-none -translate-y-0.75 bg-pancho-red-deep px-1.5 py-0.75 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
                          {product.badge}
                        </span>
                      )}
                      <span className="min-w-4 flex-1 -translate-y-1.25 border-b-2 border-dotted border-pancho-black/35" />
                    </div>
                    <div className="row-span-2 flex items-center gap-3.5 [@media(hover:none)]:order-last [@media(hover:none)]:row-span-1 [@media(hover:none)]:mt-1.5">
                      <span className="font-heading text-[26px] leading-none text-pancho-red-deep">
                        {formatPrice(product.price)}
                      </span>
                      {renderAdd(product)}
                    </div>
                    <p className="text-[13px] font-medium leading-relaxed text-pancho-black/70">{product.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nothingToShow && (
            <div className="flex flex-col items-center gap-2.5 border-2 border-dashed border-pancho-black/30 px-6 py-12 text-center">
              <span className="font-heading text-[32px] uppercase">Todavía no hay productos cargados</span>
              <span className="text-sm text-pancho-black/70">Mirá el resto del menú mientras tanto.</span>
            </div>
          )}

          {/* Combos: bloque de papel bordó, como el pie */}
          {comboProducts.map((combo, index) => (
            <article
              key={combo.id}
              {...hoverProps(combo)}
              style={{ '--i': index + 2 } as React.CSSProperties}
              className="menu-row relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-x-14 gap-y-6 overflow-hidden bg-pancho-red-deep bg-[url('/images/fondo-footer-bordo.webp')] bg-cover bg-center p-7 text-white sm:p-12"
            >
              <div className="flex flex-col gap-3.5">
                <span className="-rotate-2 self-start bg-white px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-pancho-red-deep">
                  Promo · Combo
                </span>
                <h2 className="font-heading text-[clamp(40px,5vw,68px)] leading-[0.92]">{combo.name}</h2>
                <p className="max-w-[40ch] text-[15px] font-bold leading-normal">{combo.description}</p>
                {/* Sin mouse: la foto del combo a todo el ancho, debajo de la información */}
                <div className="foto-plato mt-2 hidden w-full rotate-[-1.5deg]! [@media(hover:none)]:block">
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-900">
                    <Image src={combo.image} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <span className="font-heading text-[clamp(48px,5.5vw,72px)] leading-none">
                  {formatPrice(combo.price)}
                </span>
                {renderBigAdd(combo, 'black')}
              </div>
            </article>
          ))}
        </main>
      </div>

      {/* Foto que sigue al mouse sobre cada plato (solo con mouse) */}
      {mounted && <FotoFlotante producto={hoveredProduct} />}

      {/* Barra con el pedido: abre el carrito */}
      {mounted && totalCartCount > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto mx-auto flex w-full max-w-180 cursor-pointer items-stretch border-2 border-pancho-black bg-white text-left text-pancho-black shadow-[6px_6px_0_var(--color-pancho-black)] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <span className="flex min-w-14 items-center justify-center bg-pancho-red-deep px-4 font-heading text-[22px] text-white">
              {totalCartCount}
            </span>
            <span className="flex flex-1 items-center justify-between gap-3 px-5 py-3.5">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.08em]">Tu pedido</span>
              <span className="font-heading text-2xl leading-none text-pancho-red-deep">{formatPrice(cartTotal)}</span>
            </span>
            <span className="flex w-14.5 items-center justify-center bg-pancho-black text-white">
              <ArrowRight className="size-5 stroke-[2.5]" />
            </span>
          </button>
        </div>
      )}

      {/* Pie de página */}
      <Footer />

      {/* Carrito lateral desplegable */}
      <CartDrawer
        items={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onUpdateNote={handleUpdateNote}
        onOrderCreated={handleClearCart}
        unavailableCount={unavailableCount}
      />
    </div>
  )
}

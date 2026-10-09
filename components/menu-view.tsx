'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { formatPrice } from '@/lib/data'
import { Category, Product, CategoryFilter } from '@/lib/types'
import { esCategoriaAdicionales as esAdicionales, llevaAdicionales, TODAS } from '@/lib/menu/categoria'
import {
  agruparVariantes,
  etiquetaTamano,
  tamanosDe,
  variantePara,
  versionConPanceta,
  type GrupoMenu,
} from '@/lib/menu/variantes'
import { claveLinea, useCart } from '@/lib/cart'
import { useMounted } from '@/hooks/use-mounted'
import { SplitLines } from '@/components/split-lines'
import { FotoFlotante } from '@/components/foto-flotante'
import { ControlCantidad } from '@/components/control-cantidad'
import { BarraPedido } from '@/components/barra-pedido'

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
  // La lista de platos: al cambiar de filtro, la página vuelve al principio de esta lista
  const listaRef = useRef<HTMLElement>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory)
  // Plato que señala el mouse y su fila (la foto se pega a la fila)
  const [hovered, setHovered] = useState<{ product: Product; fila: HTMLElement } | null>(null)
  const ocultarFoto = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tamaño elegido en cada plato con variantes (por defecto, el más simple)
  const [elegido, setElegido] = useState<Record<string, number | null>>({})
  // Platos en los que se eligió la versión con panceta
  const [conPanceta, setConPanceta] = useState<Record<string, boolean>>({})
  // Adicionales elegidos en un plato antes de sumar la hamburguesa: plato → id del adicional → cantidad
  const [extrasPrevios, setExtrasPrevios] = useState<Record<string, Record<number, number>>>({})
  // Plato con el menú de adicionales abierto
  const [adicionalesAbierto, setAdicionalesAbierto] = useState<string | null>(null)

  // El menú de adicionales se cierra al tocar fuera del plato o con Escape
  useEffect(() => {
    if (!adicionalesAbierto) return
    const alTocar = (evento: PointerEvent) => {
      const fila = (evento.target as Element | null)?.closest?.('[data-grupo]')
      if (fila?.getAttribute('data-grupo') !== adicionalesAbierto) setAdicionalesAbierto(null)
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      // El foco vuelve al botón que abrió el menú
      document
        .querySelector<HTMLElement>(`[data-grupo="${CSS.escape(adicionalesAbierto)}"] [aria-expanded]`)
        ?.focus()
      setAdicionalesAbierto(null)
    }
    document.addEventListener('pointerdown', alTocar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alTocar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [adicionalesAbierto])

  useEffect(() => {
    const nav = document.querySelector('header')
    if (!nav) return
    // Con decimales: en celulares la barra mide, por ejemplo, 79,6 px y offsetHeight redondea
    const measure = () => setNavHeight(nav.getBoundingClientRect().height)
    measure()
    // Al scrollear la barra cambia su relleno, no su contenido: hay que mirar la caja entera
    // (border-box); si no, el cambio no se avisa y queda un hueco arriba de los filtros
    const observer = new ResizeObserver(measure)
    observer.observe(nav, { box: 'border-box' })
    return () => observer.disconnect()
  }, [])

  const filterOptions: CategoryFilter[] = [TODAS, ...categories.map((c) => c.name).filter((c) => !esAdicionales(c))]
  /** Unidades en el carrito; con `para`, las de ese adicional en esa hamburguesa. */
  const quantityOf = (id: number, para?: number) =>
    cart.find((item) => item.key === claveLinea(id, para))?.quantity ?? 0
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const isAll = activeCategory === TODAS
  const featured = isAll ? products.find(esMasPedida) : undefined
  const comboProducts = products.filter(
    (p) => esCombo(p.category) && (isAll || p.category === activeCategory),
  )
  // El destacado sale de la lista solo si es un plato suelto. Si tiene otros tamaños, queda en su
  // plato para que el selector no pierda esa variante.
  const destacadoConVariantes =
    !!featured &&
    agruparVariantes(products.filter((p) => p.category === featured.category)).some(
      (g) => g.variantes.length > 1 && g.variantes.some((v) => v.product.id === featured.id),
    )
  const gridProducts = products.filter(
    (p) =>
      !esCombo(p.category) &&
      !esAdicionales(p.category) &&
      (destacadoConVariantes || p.id !== featured?.id) &&
      (isAll || p.category === activeCategory),
  )
  const gridGroups = agruparVariantes(gridProducts)
  // Los adicionales (categoría «Adicionales») se ofrecen dentro de cada hamburguesa
  const adicionales = products.filter((p) => esAdicionales(p.category))
  // Cada plato con variantes cuenta una sola vez
  const countFor = (category: CategoryFilter) => {
    const deLaCategoria = (category === TODAS ? products : products.filter((p) => p.category === category)).filter(
      (p) => !esAdicionales(p.category),
    )
    return (
      agruparVariantes(deLaCategoria.filter((p) => !esCombo(p.category))).length +
      deLaCategoria.filter((p) => esCombo(p.category)).length
    )
  }
  const nothingToShow = !featured && gridProducts.length === 0 && comboProducts.length === 0

  /**
   * Lleva la página al principio de la lista: la barra de filtros queda pegada debajo de la barra de
   * arriba y los primeros platos justo debajo. Si la página todavía no pasó ese punto (se está
   * viendo el encabezado), no se mueve: bajar solo por tocar un filtro sería raro.
   */
  const volverAlPrincipioDeLaLista = useCallback(
    (suave: boolean) => {
      const lista = listaRef.current
      const filtros = lista?.previousElementSibling
      if (!lista || !(filtros instanceof HTMLElement)) return
      const principio = lista.getBoundingClientRect().top + window.scrollY - navHeight - filtros.offsetHeight
      if (window.scrollY <= principio) return
      const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // 'instant' a propósito: el CSS de la página tiene scroll-behavior: smooth y 'auto' lo seguiría
      window.scrollTo({ top: principio, behavior: suave && !sinMovimiento ? 'smooth' : 'instant' })
    },
    [navHeight],
  )

  // Al cambiar de filtro, la lista nueva es más corta y el navegador recorta la posición de la
  // página de golpe. Si en ese momento hubiera un desplazamiento suave en curso, algunos navegadores
  // lo cancelan y la vista queda en el pie, lejos de los primeros platos. Por eso, al cambiar de
  // categoría el salto es inmediato y se hace acá, apenas está la lista nueva y antes de dibujarla.
  const subirAlCambiarDeFiltro = useRef(false)
  useLayoutEffect(() => {
    if (!subirAlCambiarDeFiltro.current) return
    subirAlCambiarDeFiltro.current = false
    volverAlPrincipioDeLaLista(false)
    // Por si el navegador vuelve a ajustar la posición después (la lista cambió de alto), se confirma
    // en el cuadro siguiente. No hace nada si ya está en su lugar.
    const cuadro = requestAnimationFrame(() => volverAlPrincipioDeLaLista(false))
    return () => cancelAnimationFrame(cuadro)
  }, [activeCategory, volverAlPrincipioDeLaLista])

  // Carril de filtros: si hay más categorías a cada costado (para esfumar ese borde)
  const filtrosRef = useRef<HTMLDivElement>(null)
  const [bordesFiltros, setBordesFiltros] = useState({ izq: false, der: false })
  const medirBordesFiltros = useCallback(() => {
    const carril = filtrosRef.current
    if (!carril) return
    const izq = carril.scrollLeft > 4
    const der = carril.scrollLeft + carril.clientWidth < carril.scrollWidth - 4
    setBordesFiltros((b) => (b.izq === izq && b.der === der ? b : { izq, der }))
  }, [])

  useEffect(() => {
    const carril = filtrosRef.current
    if (!carril) return
    medirBordesFiltros()
    const observador = new ResizeObserver(medirBordesFiltros)
    observador.observe(carril)
    return () => observador.disconnect()
  }, [medirBordesFiltros])

  // La categoría elegida queda centrada en el carril (solo de costado: la página no se mueve)
  useEffect(() => {
    const carril = filtrosRef.current
    const elegido = carril?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!carril || !elegido) return
    const izquierda = elegido.offsetLeft - (carril.clientWidth - elegido.offsetWidth) / 2
    carril.scrollTo({ left: Math.max(0, izquierda), behavior: 'smooth' })
  }, [activeCategory])

  const handleCategoryClick = (category: CategoryFilter) => {
    // El filtro que ya está elegido no cambia la lista: sirve para volver arriba de ella, con
    // desplazamiento suave (no hay nada que recortar)
    if (category === activeCategory) return volverAlPrincipioDeLaLista(true)
    subirAlCambiarDeFiltro.current = true
    setActiveCategory(category)
    setHovered(null)
    // La URL acompaña al filtro, así el enlace se puede compartir y «atrás» vuelve a la misma categoría
    window.history.replaceState(
      null,
      '',
      category === TODAS ? '/menu' : `/menu?categoria=${category.toLowerCase()}`,
    )
  }

  // Solo cambia al entrar o salir de un plato: mover el mouse no vuelve a dibujar la carta.
  // Al salir se espera un momento, así al pasar a la fila de al lado la foto se desliza en vez
  // de apagarse y volver a aparecer.
  const hoverProps = (product: Product) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (ocultarFoto.current) clearTimeout(ocultarFoto.current)
      setHovered({ product, fila: e.currentTarget })
    },
    onMouseLeave: () => {
      if (ocultarFoto.current) clearTimeout(ocultarFoto.current)
      ocultarFoto.current = setTimeout(
        () => setHovered((actual) => (actual?.product.id === product.id ? null : actual)),
        120,
      )
    },
  })

  /** Cambia el tamaño o la panceta de un plato; la foto que sigue al mouse pasa a la variante nueva. */
  const elegirVariante = (grupo: GrupoMenu, cambio: { tamano?: number; panceta?: boolean }) => {
    const panceta = conPanceta[grupo.clave] ?? false
    const actual = variantePara(grupo, elegido[grupo.clave], panceta)
    const nueva = variantePara(grupo, cambio.tamano ?? actual.tamano, cambio.panceta ?? panceta)
    setElegido((e) => ({ ...e, [grupo.clave]: nueva.tamano }))
    if (cambio.panceta !== undefined) setConPanceta((c) => ({ ...c, [grupo.clave]: cambio.panceta! }))
    setHovered((h) => (h?.product.id === actual.product.id ? { product: nueva.product, fila: h.fila } : h))
  }

  /** Cambia la cantidad de un adicional elegido antes de sumar la hamburguesa. */
  const cambiarExtraPrevio = (clave: string, extraId: number, delta: number) =>
    setExtrasPrevios((todos) => {
      const delPlato = { ...todos[clave] }
      const cantidad = Math.max(0, Math.min(50, (delPlato[extraId] ?? 0) + delta))
      if (cantidad) delPlato[extraId] = cantidad
      else delete delPlato[extraId]
      return { ...todos, [clave]: delPlato }
    })

  /** Suma la hamburguesa y, atados a ella, los adicionales que se eligieron antes. */
  const agregarConExtras = (clave: string, product: Product) => {
    handleAddToCart(product)
    for (const [id, cantidad] of Object.entries(extrasPrevios[clave] ?? {})) {
      const extra = adicionales.find((a) => a.id === Number(id))
      if (extra) for (let i = 0; i < cantidad; i++) handleAddToCart(extra, product.id)
    }
    setExtrasPrevios((todos) => ({ ...todos, [clave]: {} }))
  }

  /**
   * Botón cuadrado de agregar: cuando el producto ya está en el pedido se estira a −  n  +.
   * Con `para`, el producto es un adicional de esa hamburguesa y va en su propia línea.
   */
  const renderAdd = (product: Product, para?: Product) => (
    <ControlCantidad
      nombre={para ? `${product.name} para ${para.name}` : product.name}
      cantidad={quantityOf(product.id, para?.id)}
      onAgregar={() => handleAddToCart(product, para?.id)}
      onCambiar={(delta) => handleUpdateQuantity(claveLinea(product.id, para?.id), delta)}
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
    <div className="page-menu flex min-h-screen flex-col justify-between bg-pancho-paper text-pancho-black selection:bg-pancho-orange selection:text-pancho-black">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setCartOpen(true)} />

      <div className="flex-1 pb-28">
        {/* Encabezado */}
        <section className="mx-auto max-w-300 px-4 pt-28 sm:px-6 lg:px-10">
          {/* `relative z-10`: el título de abajo es enorme y de interlineado ajustado, y la parte
              de arriba de sus letras queda sobre este enlace (el navegador usa la altura de la
              tipografía, no la del renglón). Sin esto, el clic le llegaba a una letra. */}
          <div className="load-fade relative z-10" style={{ '--d': '100ms' } as React.CSSProperties}>
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
          // 1 px por debajo de la barra: así no queda una rendija entre las dos
          style={{ top: Math.max(0, navHeight - 1) }}
          className="menu-filtros sticky z-20 mt-6 border-b border-pancho-black/20 bg-pancho-paper/95 backdrop-blur-sm sm:mt-10"
        >
          {/* Un solo renglón que se desliza de costado: en el celular no tapa media pantalla. Los bordes
              se esfuman cuando hay más categorías para ver de ese lado */}
          <div
            ref={filtrosRef}
            role="tablist"
            aria-label="Categorías del menú"
            onScroll={medirBordesFiltros}
            data-mas-izq={bordesFiltros.izq || undefined}
            data-mas-der={bordesFiltros.der || undefined}
            className="filtros-carril mx-auto flex max-w-300 overflow-x-auto px-4 sm:px-6 lg:px-10"
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
          ref={listaRef}
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
                {gridGroups.map((grupo, index) => {
                  const actual = variantePara(grupo, elegido[grupo.clave], conPanceta[grupo.clave])
                  const product = actual.product
                  const tamanos = tamanosDe(grupo)
                  // La panceta se elige con su botón y se cobra con el precio de la versión «(con panceta)»
                  const panceta = versionConPanceta(grupo, actual.tamano)
                  // La descripción es la del plato común: la de la versión con panceta repite «y panceta»
                  const sinPanceta = variantePara(grupo, actual.tamano, false).product
                  const extrasDelPlato = panceta
                    ? adicionales.filter((a) => !/panceta.*hamburguesa/i.test(a.name))
                    : adicionales
                  const conAdicionales = extrasDelPlato.length > 0 && llevaAdicionales(product.category)
                  const adicionalesVisibles = adicionalesAbierto === grupo.clave
                  // Mientras la hamburguesa no está en el pedido, los adicionales se van eligiendo en el
                  // plato y suman al precio (como el tamaño); al tocar el + entran con ella.
                  const enPedido = quantityOf(product.id) > 0
                  const cantidadExtra = (extra: Product) =>
                    enPedido ? quantityOf(extra.id, product.id) : (extrasPrevios[grupo.clave]?.[extra.id] ?? 0)
                  const precioPlato =
                    product.price + extrasDelPlato.reduce((suma, extra) => suma + extra.price * cantidadExtra(extra), 0)
                  const nombrePlato = [
                    grupo.variantes.length > 1 ? grupo.nombre : product.name,
                    tamanos.length > 1 && actual.tamano ? etiquetaTamano(actual.tamano) : null,
                    actual.conPanceta ? 'con panceta' : null,
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                  <div
                    key={grupo.clave}
                    data-grupo={grupo.clave}
                    {...hoverProps(product)}
                    style={{ '--i': index + 1, zIndex: adicionalesVisibles ? 10 : undefined } as React.CSSProperties}
                    className="menu-row relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4.5 gap-y-1.5 border-b border-pancho-black/20 py-5 [@media(hover:none)]:grid-cols-[minmax(0,1fr)_auto] [@media(hover:none)]:items-start [@media(hover:none)]:gap-x-4"
                  >
                    {/* Sin mouse no hay foto que siga al puntero: va grande a la derecha de cada
                        plato, y el precio con el + pasa abajo de la descripción */}
                    <div className="foto-plato col-start-2 row-span-3 row-start-1 mt-1 hidden self-center [@media(hover:none)]:block">
                      <div className="relative size-26 overflow-hidden bg-neutral-900">
                        <Image src={product.image} alt="" fill sizes="104px" className="object-cover" />
                      </div>
                    </div>
                    {/* Con mouse, la línea del título ocupa todo el ancho y termina en el precio (como en
                        una carta); el + va abajo, a la derecha, en un hueco que ya tiene el ancho de la caja
                        abierta. Así abrir el contador no corre ni acomoda el texto de la fila. */}
                    <div className="col-span-2 flex min-w-0 items-baseline gap-2.5 [@media(hover:none)]:col-span-1">
                      <h3 className="font-heading text-[clamp(22px,2vw,26px)] leading-[1.05]">{grupo.variantes.length > 1 ? grupo.nombre : product.name}</h3>
                      {product.badge && (
                        <span className="flex-none -translate-y-0.75 bg-pancho-red-deep px-1.5 py-0.75 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
                          {product.badge}
                        </span>
                      )}
                      <span className="min-w-4 flex-1 -translate-y-1.25 border-b-2 border-dotted border-pancho-black/35" />
                      <span className="hidden flex-none font-heading text-[26px] leading-none text-pancho-red-deep [@media(hover:hover)]:inline">
                        {formatPrice(precioPlato)}
                      </span>
                    </div>
                    <div className="col-start-2 row-start-2 flex items-center justify-self-end gap-3.5 [@media(hover:none)]:order-last [@media(hover:none)]:col-auto [@media(hover:none)]:row-auto [@media(hover:none)]:mt-1.5 [@media(hover:none)]:justify-self-auto">
                      {/* El precio de esta línea es solo para pantallas táctiles: con mouse va en el título */}
                      <span className="font-heading text-[26px] leading-none text-pancho-red-deep [@media(hover:hover)]:hidden">
                        {formatPrice(precioPlato)}
                      </span>
                      <ControlCantidad
                        nombre={product.name}
                        cantidad={quantityOf(product.id)}
                        onAgregar={() => agregarConExtras(grupo.clave, product)}
                        onCambiar={(delta) => handleUpdateQuantity(claveLinea(product.id), delta)}
                      />
                    </div>
                    <p className="text-[13px] font-medium leading-relaxed text-pancho-black/70">{sinPanceta.description}</p>
                    {(tamanos.length > 1 || panceta || conAdicionales) && (
                      <div className="col-span-2 mt-1 flex flex-wrap items-center gap-2 [@media(hover:none)]:col-span-1">
                        {tamanos.length > 1 && (
                          <div role="group" aria-label={`Tamaño de ${grupo.nombre}`} className="flex">
                            {tamanos.map((t) => (
                              <button
                                key={t}
                                type="button"
                                aria-pressed={actual.tamano === t}
                                onClick={() => elegirVariante(grupo, { tamano: t })}
                                className="opcion-plato -ml-px first:ml-0"
                              >
                                {etiquetaTamano(t)}
                              </button>
                            ))}
                          </div>
                        )}
                        {panceta && (
                          <button
                            type="button"
                            aria-pressed={actual.conPanceta}
                            onClick={() => elegirVariante(grupo, { panceta: !actual.conPanceta })}
                            className="opcion-plato"
                          >
                            Con panceta
                          </button>
                        )}
                        {conAdicionales && (
                          <button
                            type="button"
                            aria-expanded={adicionalesVisibles}
                            onClick={() => setAdicionalesAbierto(adicionalesVisibles ? null : grupo.clave)}
                            className="opcion-plato inline-flex items-center gap-1.5"
                          >
                            Adicionales
                            <ChevronDown className={`size-3.5 stroke-3 transition-transform ${adicionalesVisibles ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    )}
                    {conAdicionales && adicionalesVisibles && (
                      <ul className="col-span-2 mt-1 flex flex-col border border-pancho-black/15 bg-white bg-[url('/images/fondo-papel-blanco.webp')] bg-cover bg-center px-3.5 py-1.5 [@media(hover:hover)]:absolute [@media(hover:hover)]:inset-x-0 [@media(hover:hover)]:top-full [@media(hover:hover)]:z-20 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                        <li className="pt-1 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-pancho-black/55">
                          Para tu {nombrePlato}
                        </li>
                        {extrasDelPlato.map((extra) => (
                          <li
                            key={extra.id}
                            className="flex items-center gap-3 border-b border-pancho-black/10 py-2 last:border-b-0"
                          >
                            <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">{extra.name}</span>
                            <span className="flex-none font-heading text-lg leading-none text-pancho-red-deep">
                              +{formatPrice(extra.price)}
                            </span>
                            {enPedido ? (
                              renderAdd(extra, product)
                            ) : (
                              <ControlCantidad
                                nombre={`${extra.name} para ${product.name}`}
                                cantidad={cantidadExtra(extra)}
                                onAgregar={() => cambiarExtraPrevio(grupo.clave, extra.id, 1)}
                                onCambiar={(delta) => cambiarExtraPrevio(grupo.clave, extra.id, delta)}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  )
                })}
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
              {/* Precio arriba y botón abajo, y a la derecha la foto del combo, siempre a la vista
                  (con mouse; sin mouse va debajo de la información), un poco más grande que los dos */}
              <div className="flex items-center gap-8 lg:-ml-12">
                <div className="flex flex-none flex-col items-start gap-5">
                  <span className="font-heading text-[clamp(48px,5.5vw,72px)] leading-none">
                    {formatPrice(combo.price)}
                  </span>
                  {renderBigAdd(combo, 'black')}
                </div>
                <div
                  aria-hidden="true"
                  className="relative hidden size-[calc(clamp(48px,5.5vw,72px)+1.25rem+var(--alto-boton,3.25rem)+4.5rem)] flex-none rotate-3 overflow-hidden border-2 border-white bg-neutral-900 shadow-[6px_6px_0_rgba(0,0,0,0.35)] [@media(hover:hover)]:block"
                >
                  <Image src={combo.image} alt="" fill sizes="220px" className="object-cover" />
                </div>
              </div>
            </article>
          ))}
        </main>
      </div>

      {/* Foto pegada al plato que señala el mouse (solo con mouse) */}
      {mounted && <FotoFlotante producto={hovered?.product ?? null} ancla={hovered?.fila ?? null} />}

      {/* Cartel con el pedido: abre el carrito */}
      {mounted && <BarraPedido cantidad={totalCartCount} total={cartTotal} onAbrir={() => setCartOpen(true)} />}

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

'use client'

import React, { useCallback, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { VersusSection } from '@/components/versus-section'
import { BurgerTraveler } from '@/components/burger-traveler'
import { BenefitsSection } from '@/components/benefits-section'
import { AboutSection } from '@/components/about-section'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/types'

interface LandingViewProps {
  /** Menú actual: el carrito toma de acá nombres y precios. */
  products: Product[]
}

export function LandingView({ products }: LandingViewProps) {
  const { cart, totalCartCount, unavailableCount, handleUpdateQuantity, handleRemoveItem, handleUpdateNote, handleClearCart } =
    useCart(products)
  const [cartOpen, setCartOpen] = useState(false)
  // La sección de elección espera a la hamburguesa que viaja desde el hero
  const [burgerArrived, setBurgerArrived] = useState(false)
  const handleBurgerArrive = useCallback(() => setBurgerArrived(true), [])

  return (
    <div className="page-home min-h-screen bg-pancho-paper text-pancho-black selection:bg-pancho-orange selection:text-pancho-black">
      {/* Encabezado fijo / Barra de navegación */}
      <Navbar cartCount={totalCartCount} onOpenCart={() => setCartOpen(true)} />

      <main>
        {/* Hero y sección de elección comparten escenario y papel de fondo:
            la hamburguesa viaja de uno a la otra sin cruzar ningún corte */}
        <div className="intro-stage relative overflow-x-clip">
          {/* Sección principal (Hero) */}
          <Hero />

          {/* Pantalla partida: hamburguesa o pancho, cada mitad lleva a la carta ya filtrada.
              Su contenido aparece recién cuando la hamburguesa llegó a su lugar. */}
          <VersusSection ready={burgerArrived} />

          {/* La hamburguesa que se desplaza con el scroll entre las dos secciones */}
          <BurgerTraveler onArrive={handleBurgerArrive} />
        </div>

        {/* Nosotros y las cifras comparten una sola hoja de papel crema, sin corte entre las dos */}
        <div className="bg-pancho-paper bg-[url('/images/fondo-secciones-crema.webp')] bg-cover bg-top">
          {/* Nosotros: título, fotos y texto que se entintan con el scroll */}
          <AboutSection />

          {/* Cifras de la marca, en tickets de comanda */}
          <BenefitsSection />
        </div>
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
        onUpdateNote={handleUpdateNote}
        onOrderCreated={handleClearCart}
        unavailableCount={unavailableCount}
      />
    </div>
  )
}

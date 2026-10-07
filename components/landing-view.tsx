'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { VersusSection } from '@/components/versus-section'
import { BurgerTraveler } from '@/components/burger-traveler'
import { MarqueeBand } from '@/components/marquee-band'
import { BenefitsSection } from '@/components/benefits-section'
import { AboutSection } from '@/components/about-section'
import { SecretSection } from '@/components/secret-section'
import { FinalCTA } from '@/components/final-cta'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/types'

interface LandingViewProps {
  /** Menú actual: el carrito toma de acá nombres y precios. */
  products: Product[]
}

export function LandingView({ products }: LandingViewProps) {
  const { cart, totalCartCount, unavailableCount, handleUpdateQuantity, handleRemoveItem, handleClearCart } =
    useCart(products)
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div className="page-home min-h-screen bg-pancho-paper text-pancho-black selection:bg-pancho-orange selection:text-pancho-black">
      {/* Encabezado fijo / Barra de navegación */}
      <Navbar cartCount={totalCartCount} onOpenCart={() => setCartOpen(true)} />

      <main>
        {/* Hero y sección de elección comparten escenario: la hamburguesa viaja de uno a la otra */}
        <div className="intro-stage relative overflow-x-clip">
          {/* Sección principal (Hero) */}
          <Hero />

          {/* Pantalla partida: hamburguesa o pancho, cada mitad lleva a la carta ya filtrada */}
          <VersusSection />

          {/* La hamburguesa que se desplaza con el scroll entre las dos secciones */}
          <BurgerTraveler />
        </div>

        {/* Cinta bordó con las palabras de la marca en movimiento */}
        <MarqueeBand />

        {/* Sobre nosotros, en papel crema */}
        <AboutSection />

        {/* Nuestro secreto artesanal: la hamburguesa con sus tres notas, en papel naranja */}
        <SecretSection />

        {/* Cifras de la marca, en tickets sobre papel crema */}
        <BenefitsSection />

        {/* Banner final de conversión */}
        <FinalCTA hasItems={cart.length > 0} onOpenCart={() => setCartOpen(true)} />
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
        onOrderCreated={handleClearCart}
        unavailableCount={unavailableCount}
      />
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { VersusSection } from '@/components/versus-section'
import { BurgerTraveler } from '@/components/burger-traveler'
import { MarqueeBand } from '@/components/marquee-band'
import { BenefitsSection } from '@/components/benefits-section'
import { AboutSection } from '@/components/about-section'
import { FinalCTA } from '@/components/final-cta'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { useCart } from '@/lib/cart'

export default function DonPanchoLanding() {
  const { cart, totalCartCount, handleUpdateQuantity, handleRemoveItem, handleClearCart } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div className="min-h-screen bg-pancho-black text-pancho-cream selection:bg-pancho-orange selection:text-pancho-black">
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

        {/* Cinta blanca con las palabras de la marca en movimiento */}
        <MarqueeBand />

        {/* Sección Sobre nosotros con animación de entrada guiada por scroll */}
        <AboutSection />

        {/* Propuesta de valor y beneficios de la marca */}
        <BenefitsSection />

        {/* Banner final de conversión */}
        <FinalCTA cart={cart} />
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
      />
    </div>
  )
}

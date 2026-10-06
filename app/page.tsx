'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { BenefitsSection } from '@/components/benefits-section'
import { AboutSection } from '@/components/about-section'
import { FinalCTA } from '@/components/final-cta'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { useCart } from '@/lib/cart'

export default function CheesyBiteLanding() {
  const { cart, totalCartCount, handleAddToCart, handleUpdateQuantity, handleRemoveItem } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cheesy-black text-cheesy-cream selection:bg-cheesy-yellow selection:text-cheesy-black">
      {/* Encabezado fijo / Barra de navegación */}
      <Navbar cartCount={totalCartCount} onOpenCart={() => setCartOpen(true)} />

      <main>
        {/* Sección principal (Hero) con composición visual */}
        <Hero onQuickOrder={() => setCartOpen(true)} />

        {/* Sección Sobre nosotros con animación de entrada guiada por scroll */}
        <AboutSection />

        {/* Propuesta de valor y beneficios de la marca */}
        <BenefitsSection />

        {/* Banner final de conversión */}
        <FinalCTA cart={cart} onQuickOrder={() => setCartOpen(true)} />
      </main>

      {/* Pie de página */}
      <Footer />

      {/* Carrito lateral desplegable con checkout por WhatsApp */}
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

'use client'

import { useState, useEffect } from 'react'
import { CartItem, Product } from './types'

const CART_STORAGE_KEY = 'cheesybite_cart'

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        // Se lee recién al montar para que el HTML del servidor coincida con el del navegador.
        // El carrito se rehace en la etapa 2 (guardar solo id y cantidad).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(JSON.parse(saved))
      }
    } catch {
      // Ignorar errores de parseo en SSR/privacidad
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Ignorar quota / almacenamiento deshabilitado
    }
  }, [cart, isLoaded])

  const handleAddToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  const handleRemoveItem = (id: number) => {
    setCart((current) => current.filter((item) => item.id !== id))
  }

  const handleClearCart = () => setCart([])

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart,
    totalCartCount,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
  }
}

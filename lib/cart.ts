'use client'

import { useState, useEffect, useMemo } from 'react'
import { CartEntry, CartItem, Product } from './types'

const CART_STORAGE_KEY = 'donpancho_cart'

/** Largo máximo de la aclaración de cada producto (el servidor acepta hasta 200). */
export const NOTE_MAX_LENGTH = 200

/**
 * Lee el carrito guardado. Acepta también el formato viejo (copia completa del
 * producto): de cada ítem se queda con el id, la cantidad y la aclaración.
 */
function leerCarritoGuardado(): CartEntry[] {
  const guardado = localStorage.getItem(CART_STORAGE_KEY)
  if (!guardado) return []
  const datos: unknown = JSON.parse(guardado)
  if (!Array.isArray(datos)) return []
  return datos.flatMap((item) => {
    const { id, quantity, note } = (item ?? {}) as Record<string, unknown>
    if (!Number.isInteger(id) || !Number.isInteger(quantity) || (quantity as number) <= 0) return []
    const entry: CartEntry = { id: id as number, quantity: quantity as number }
    if (typeof note === 'string' && note.trim()) entry.note = note.slice(0, NOTE_MAX_LENGTH)
    return [entry]
  })
}

/**
 * Carrito del cliente. En el navegador se guardan solo ids, cantidades y aclaraciones; nombre,
 * precio e imagen salen del menú actual (`products`), así nunca se muestra un
 * precio viejo. El total que vale es el que calcula el servidor al guardar el pedido.
 */
export function useCart(products: Product[]) {
  const [entries, setEntries] = useState<CartEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      // Se lee recién al montar para que el HTML del servidor coincida con el del navegador.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries(leerCarritoGuardado())
    } catch {
      // Ignorar errores de parseo o almacenamiento deshabilitado
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // Ignorar quota / almacenamiento deshabilitado
    }
  }, [entries, isLoaded])

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const cart: CartItem[] = entries.flatMap((entry) => {
    const product = productById.get(entry.id)
    return product ? [{ ...product, quantity: entry.quantity, note: entry.note }] : []
  })

  // Productos que estaban en el carrito pero ya no están en el menú (desactivados o borrados)
  const unavailableCount = entries.length - cart.length

  // Cada cambio descarta de paso lo que ya no está disponible
  const update = (change: (current: CartEntry[]) => CartEntry[]) =>
    setEntries((current) => change(current.filter((entry) => productById.has(entry.id))))

  const handleAddToCart = (product: Product) => {
    update((current) =>
      current.some((entry) => entry.id === product.id)
        ? current.map((entry) =>
            entry.id === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        : [...current, { id: product.id, quantity: 1 }]
    )
  }

  const handleUpdateQuantity = (id: number, delta: number) => {
    update((current) =>
      current
        .map((entry) => (entry.id === id ? { ...entry, quantity: entry.quantity + delta } : entry))
        .filter((entry) => entry.quantity > 0)
    )
  }

  const handleRemoveItem = (id: number) => {
    update((current) => current.filter((entry) => entry.id !== id))
  }

  const handleUpdateNote = (id: number, note: string) => {
    update((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry
        const updated: CartEntry = { id: entry.id, quantity: entry.quantity }
        if (note.trim()) updated.note = note.slice(0, NOTE_MAX_LENGTH)
        return updated
      })
    )
  }

  const handleClearCart = () => setEntries([])

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart,
    totalCartCount,
    unavailableCount,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleUpdateNote,
    handleClearCart,
  }
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { aclaracionAdicional } from './orders/estados'
import { CartEntry, CartItem, Product } from './types'

const CART_STORAGE_KEY = 'donpancho_cart'

/** Largo máximo de la aclaración de cada producto (el servidor acepta hasta 200). */
export const NOTE_MAX_LENGTH = 200

/** Clave de una línea del carrito: el producto y, si es un adicional, su hamburguesa. */
export const claveLinea = (id: number, para?: number) => (para ? `${id}>${para}` : String(id))
const claveDe = (entry: CartEntry) => claveLinea(entry.id, entry.para)

/**
 * Aclaración que llega al local. Un adicional no lleva aclaración propia, solo a qué hamburguesa va;
 * el resto, lo que escribió el cliente.
 */
export function aclaracionDe(item: CartItem): string | null {
  if (item.para) return aclaracionAdicional(item.para.name).slice(0, NOTE_MAX_LENGTH)
  return item.note?.trim() || null
}

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
    const { id, quantity, note, para } = (item ?? {}) as Record<string, unknown>
    if (!Number.isInteger(id) || !Number.isInteger(quantity) || (quantity as number) <= 0) return []
    const entry: CartEntry = { id: id as number, quantity: quantity as number }
    if (typeof note === 'string' && note.trim()) entry.note = note.slice(0, NOTE_MAX_LENGTH)
    if (Number.isInteger(para)) entry.para = para as number
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

  // Cada adicional va justo debajo de su hamburguesa (así sale también en la comanda)
  const resolver = (entry: CartEntry): CartItem[] => {
    const product = productById.get(entry.id)
    if (!product) return []
    const hamburguesa = entry.para ? productById.get(entry.para) : undefined
    if (entry.para && !hamburguesa) return []
    return [
      {
        ...product,
        key: claveDe(entry),
        quantity: entry.quantity,
        note: entry.note,
        para: hamburguesa && { id: hamburguesa.id, name: hamburguesa.name },
      },
    ]
  }
  const sueltos = entries.filter((entry) => !entry.para)
  const cart: CartItem[] = sueltos.flatMap((entry) => [
    ...resolver(entry),
    ...entries.filter((extra) => extra.para === entry.id).flatMap(resolver),
  ])

  // Productos que estaban en el carrito pero ya no están en el menú (desactivados o borrados)
  const unavailableCount = entries.filter((entry) => !productById.has(entry.id)).length

  // Cada cambio descarta de paso lo que ya no está disponible y los adicionales que se quedaron
  // sin su hamburguesa
  const update = (change: (current: CartEntry[]) => CartEntry[]) =>
    setEntries((current) => {
      const nuevos = change(current.filter((entry) => productById.has(entry.id)))
      const hamburguesas = new Set(nuevos.filter((entry) => !entry.para).map((entry) => entry.id))
      return nuevos.filter((entry) => !entry.para || hamburguesas.has(entry.para))
    })

  /** Suma una unidad. Con `para`, es un adicional de esa hamburguesa. */
  const handleAddToCart = (product: Product, para?: number) => {
    const key = claveLinea(product.id, para)
    update((current) =>
      current.some((entry) => claveDe(entry) === key)
        ? current.map((entry) =>
            claveDe(entry) === key ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        : [...current, para ? { id: product.id, quantity: 1, para } : { id: product.id, quantity: 1 }]
    )
  }

  const handleUpdateQuantity = (key: string, delta: number) => {
    update((current) =>
      current
        .map((entry) => (claveDe(entry) === key ? { ...entry, quantity: entry.quantity + delta } : entry))
        .filter((entry) => entry.quantity > 0)
    )
  }

  const handleRemoveItem = (key: string) => {
    update((current) => current.filter((entry) => claveDe(entry) !== key))
  }

  const handleUpdateNote = (key: string, note: string) => {
    update((current) =>
      current.map((entry) => {
        if (claveDe(entry) !== key) return entry
        const updated: CartEntry = { id: entry.id, quantity: entry.quantity }
        if (entry.para) updated.para = entry.para
        if (note.trim()) updated.note = note.slice(0, NOTE_MAX_LENGTH)
        return updated
      })
    )
  }

  const handleClearCart = () => setEntries([])

  // Los adicionales no suman al contador: van con su hamburguesa
  const totalCartCount = cart.reduce((sum, item) => sum + (item.para ? 0 : item.quantity), 0)

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

export interface Product {
  id: number
  name: string
  /** Nombre de la categoría (viene de la base). */
  category: string
  description: string
  price: number
  image: string
  badge?: string
}

export interface Category {
  id: number
  name: string
}

/** Lo que se guarda del carrito en el navegador: solo id y cantidad, nunca precios. */
export interface CartEntry {
  id: number
  quantity: number
  /** Aclaración del cliente para este producto (sin cebolla, sin aderezo…). */
  note?: string
  /** Adicional pedido para una hamburguesa del carrito: id de esa hamburguesa. */
  para?: number
}

/** Ítem del carrito ya resuelto contra el menú actual (nombre, precio e imagen al día). */
export interface CartItem extends Product {
  /** Identifica la línea: el mismo adicional puede ir en dos hamburguesas distintas. */
  key: string
  quantity: number
  note?: string
  /** Hamburguesa a la que va este adicional. */
  para?: { id: number; name: string }
}

/** 'Todas' o el nombre de una categoría de la base. */
export type CategoryFilter = string

export interface SiteConfig {
  name: string
  slogan: string
  whatsappNumber: string
  displayPhone: string
  address: string
  schedule: string
  socialLinks: {
    instagram: string
  }
}

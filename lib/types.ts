export interface Product {
  id: number
  name: string
  category: 'Hamburguesas' | 'Panchos' | 'Combos'
  description: string
  price: number
  image: string
  badge?: string
}

export interface CartItem extends Product {
  quantity: number
}

export type CategoryFilter = 'Todas' | 'Hamburguesas' | 'Panchos' | 'Combos'

export interface SiteConfig {
  name: string
  slogan: string
  whatsappNumber: string
  displayPhone: string
  address: string
  schedule: string
  socialLinks: {
    instagram: string
    facebook: string
    tiktok: string
  }
}

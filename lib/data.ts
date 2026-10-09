import { Product, SiteConfig } from './types'

// VALORES INICIALES Y POR DEFECTO de los datos del local. El sitio los lee de la base
// (`configuracion`, ver lib/local/) y el dueño los edita en el panel: esto solo lo usa el
// seed y, si la base no tiene un dato, como respaldo.
export const SITE_CONFIG: SiteConfig = {
  name: 'Don Pancho & Burger',
  slogan: 'El verdadero sabor de la felicidad',
  // TEMPORAL: WhatsApp de Alex para pruebas. Reemplazar por el del local antes de la entrega.
  whatsappNumber: '5493442668413',
  displayPhone: '+54 3442 66-8413',
  address: 'Congreso de Tucumán 782, Concepción del Uruguay',
  schedule: 'Mar — Dom · 20:30 a 00:10',
  socialLinks: {
    instagram: 'https://instagram.com',
  },
}

// DATOS DE TRANSFERENCIA FALSOS, solo para desarrollo (los carga npm run db:seed en `configuracion`).
// Reemplazar por la cuenta real del local antes de la entrega.
export const DATOS_TRANSFERENCIA_PRUEBA = {
  alias: 'donpancho.prueba',
  cbu: '0000000000000000000000',
  titular: 'Don Pancho (DATOS DE PRUEBA)',
  banco: 'Banco de prueba',
}

// MENÚ INICIAL PARA EL SEED (npm run db:seed). La web ya no lo lee: la carta sale de la
// base (lib/menu/queries.ts). Cambiar esto no cambia la carta de una base ya cargada.
export const CATEGORIES = ['Todas', 'Hamburguesas', 'Panchos', 'Combos'] as const

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'La Clásica',
    category: 'Hamburguesas',
    description: 'Carne 150g, cheddar, lechuga, tomate, cebolla y salsa especial.',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Bacon Lover',
    category: 'Hamburguesas',
    description: 'Carne 150g, cheddar, panceta crujiente, lechuga, tomate y salsa BBQ.',
    price: 6500,
    badge: 'Más pedida',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Champi Power',
    category: 'Hamburguesas',
    description: 'Carne 150g, cheddar, champiñones salteados, lechuga y salsa de la casa.',
    price: 6200,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Green Burger',
    category: 'Hamburguesas',
    description: 'Medallón de vegetales, cheddar, aguacate, lechuga, tomate y cebolla.',
    price: 5800,
    badge: 'Veggie',
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Doble Cheddar Smash',
    category: 'Hamburguesas',
    description: 'Doble carne smash 120g, cuádruple cheddar fundido y cebolla caramelizada.',
    price: 7200,
    badge: 'Bomba',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 6,
    name: 'Papas Cheesy Bacon',
    category: 'Combos',
    description: 'Papas bastón crocantes bañadas en cheddar fundido y lluvia de panceta crocante.',
    price: 3900,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 7,
    name: 'Crispy Onion BBQ',
    category: 'Hamburguesas',
    description: 'Carne smash 160g, cheddar americano, aros de cebolla crocantes y salsa BBQ ahumada.',
    price: 6800,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 8,
    name: 'Combo Cheesy Dúo',
    category: 'Combos',
    description: '2 Burgers Clásicas simples + Papas cheddar grandes + 2 gaseosas a elección.',
    price: 13500,
    badge: 'Promo',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=85',
  },
  // EJEMPLO: panchos de muestra para poder probar el filtro de la carta.
  // Nombres, descripciones y precios inventados: reemplazar por la carta real de Don Pancho.
  {
    id: 9,
    name: 'Pancho Clásico',
    category: 'Panchos',
    description: 'Salchicha, pan y aderezos a elección.',
    price: 3500,
    image: '/images/pancho-recortado.webp',
  },
  {
    id: 10,
    name: 'Pancho Cheddar y Panceta',
    category: 'Panchos',
    description: 'Salchicha, cheddar fundido y panceta en cubos.',
    price: 4500,
    image: '/images/pancho-recortado.webp',
  },
]

export const formatPrice = (value: number): string => `$${value.toLocaleString('es-AR')}`

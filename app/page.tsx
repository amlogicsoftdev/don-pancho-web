import { LandingView } from '@/components/landing-view'
import { obtenerMenu } from '@/lib/menu/queries'

// El inicio no muestra la carta, pero el carrito necesita el menú actual para nombres y precios
export default async function HomePage() {
  const { products } = await obtenerMenu()
  return <LandingView products={products} />
}

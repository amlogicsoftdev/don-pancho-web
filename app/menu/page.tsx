import { MenuView } from '@/components/menu-view'
import { categoryFromParam } from '@/lib/data'

interface MenuPageProps {
  searchParams: Promise<{ categoria?: string | string[] }>
}

// La carta puede abrir ya filtrada: /menu?categoria=hamburguesas o /menu?categoria=panchos
export default async function MenuPage({ searchParams }: MenuPageProps) {
  const { categoria } = await searchParams
  const initialCategory = categoryFromParam(categoria)

  // La `key` hace que la vista arranque de nuevo si se navega a otra categoría por enlace
  return <MenuView key={initialCategory} initialCategory={initialCategory} />
}

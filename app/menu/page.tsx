import { MenuView } from '@/components/menu-view'
import { categoriaDesdeParametro } from '@/lib/menu/categoria'
import { obtenerMenu } from '@/lib/menu/queries'

interface MenuPageProps {
  searchParams: Promise<{ categoria?: string | string[] }>
}

// La carta se lee de la base en cada visita y puede abrir ya filtrada:
// /menu?categoria=hamburguesas o /menu?categoria=panchos
export default async function MenuPage({ searchParams }: MenuPageProps) {
  const [{ categoria }, { categories, products }] = await Promise.all([searchParams, obtenerMenu()])
  // «Adicionales» no se puede abrir como sección: sus productos se eligen dentro de cada hamburguesa
  const initialCategory = categoriaDesdeParametro(
    categoria,
    categories.filter((c) => !/^adicionales$/i.test(c.name)),
  )

  // La `key` hace que la vista arranque de nuevo si se navega a otra categoría por enlace
  return (
    <MenuView
      key={initialCategory}
      categories={categories}
      products={products}
      initialCategory={initialCategory}
    />
  )
}

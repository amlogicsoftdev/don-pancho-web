import type { Category, CategoryFilter } from '@/lib/types'

export const TODAS: CategoryFilter = 'Todas'

/** La categoría «Adicionales»: no es una sección de la carta, sus productos se eligen dentro de cada hamburguesa. */
export const esCategoriaAdicionales = (nombre: string) => /^adicionales$/i.test(nombre.trim())

/** Categorías cuyos platos ofrecen adicionales («Hamburguesas», «Mega hamburguesas»). */
export const llevaAdicionales = (nombre: string) => /hamburguesa/i.test(nombre)

/** "Hamburguesas" → "hamburguesas", "Combos Dúo" → "combos-duo". Se usa en `?categoria=`. */
export function slugCategoria(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/**
 * Categoría que corresponde al parámetro `?categoria=` de la carta (por ejemplo,
 * `/menu?categoria=panchos`). Si falta o no coincide con ninguna, devuelve 'Todas'.
 */
export function categoriaDesdeParametro(
  valor: string | string[] | undefined,
  categorias: Category[],
): CategoryFilter {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  if (!crudo) return TODAS
  const buscado = slugCategoria(crudo)
  return categorias.find((c) => slugCategoria(c.name) === buscado)?.name ?? TODAS
}

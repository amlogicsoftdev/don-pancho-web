import type { Product } from '@/lib/types'

// Los productos de la base se cargan uno por uno («DON CHEESE x2 (con panceta)»). Para la carta
// pública se juntan los que comparten nombre base en un solo plato donde se elige el tamaño (x1,
// x2, x3) y si va con panceta: la versión «(con panceta)» se elige con un botón del plato y se
// cobra con su propio precio. Cada variante sigue siendo un producto con su propio id y precio:
// el carrito y el servidor no se enteran del agrupado. La venta de mostrador del panel usa el mismo
// agrupado con sus propios productos.

/** Lo mínimo que hace falta para agrupar: el nombre y la categoría. */
interface Plato {
  name: string
  category: string
}

export interface Variante<P extends Plato = Product> {
  product: P
  /** Cantidad de medallones (x1, x2…), o null si el nombre no la indica. */
  tamano: number | null
  conPanceta: boolean
}

export interface GrupoMenu<P extends Plato = Product> {
  clave: string
  /** Nombre sin tamaño ni «(con panceta)». */
  nombre: string
  /** Ordenadas de menor a mayor tamaño. */
  variantes: Variante<P>[]
}


const RE_PANCETA = /\s*\(con panceta\)\s*$/i
const RE_TAMANO = /\s+x(\d+)\s*$/i

function analizar<P extends Plato>(product: P): { base: string; variante: Variante<P> } {
  const conPanceta = RE_PANCETA.test(product.name)
  const sinPanceta = product.name.replace(RE_PANCETA, '')
  const tamano = RE_TAMANO.exec(sinPanceta)
  return {
    base: sinPanceta.replace(RE_TAMANO, '').trim(),
    variante: { product, tamano: tamano ? Number(tamano[1]) : null, conPanceta },
  }
}

/** Junta los productos de una misma categoría con el mismo nombre base. Respeta el orden de la carta. */
export function agruparVariantes<P extends Plato>(products: P[]): GrupoMenu<P>[] {
  const grupos = new Map<string, GrupoMenu<P>>()
  for (const product of products) {
    const { base, variante } = analizar(product)
    const clave = `${product.category}|${base.toLowerCase()}`
    const grupo = grupos.get(clave)
    if (grupo) grupo.variantes.push(variante)
    else grupos.set(clave, { clave, nombre: base, variantes: [variante] })
  }
  for (const grupo of grupos.values()) {
    grupo.variantes.sort((a, b) => (a.tamano ?? 0) - (b.tamano ?? 0) || Number(a.conPanceta) - Number(b.conPanceta))
  }
  return [...grupos.values()]
}

export const tamanosDe = <P extends Plato>(grupo: GrupoMenu<P>) =>
  [...new Set(grupo.variantes.map((v) => v.tamano))].filter((t): t is number => t !== null)

/** Variante del tamaño y la panceta elegidos; si esa combinación no existe, la más parecida. */
export function variantePara<P extends Plato>(
  grupo: GrupoMenu<P>,
  tamano?: number | null,
  conPanceta = false,
): Variante<P> {
  const delTamano = grupo.variantes.filter((v) => tamano === undefined || v.tamano === tamano)
  const opciones = delTamano.length ? delTamano : grupo.variantes
  return opciones.find((v) => v.conPanceta === conPanceta) ?? opciones[0]
}

/** La versión con panceta del mismo tamaño, si el plato la tiene (y también una sin panceta). */
export function versionConPanceta<P extends Plato>(grupo: GrupoMenu<P>, tamano: number | null): Variante<P> | undefined {
  const delTamano = grupo.variantes.filter((v) => v.tamano === tamano)
  return delTamano.some((v) => !v.conPanceta) ? delTamano.find((v) => v.conPanceta) : undefined
}

export function etiquetaTamano(tamano: number): string {
  return ({ 1: 'Simple', 2: 'Doble', 3: 'Triple' } as Record<number, string>)[tamano] ?? `x${tamano}`
}

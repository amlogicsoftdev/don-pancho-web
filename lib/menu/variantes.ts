import type { Product } from '@/lib/types'

// Los productos de la base se cargan uno por uno («DON CHEESE x2 (con panceta)»). Para la carta
// pública se juntan los que comparten nombre base en un solo plato donde se elige el tamaño (x1,
// x2, x3). Las versiones «(con panceta)» no se ofrecen: la panceta se pide desde Adicionales. Cada variante sigue siendo un producto con su propio id y precio:
// el carrito y el servidor no se enteran del agrupado.

export interface Variante {
  product: Product
  /** Cantidad de medallones (x1, x2…), o null si el nombre no la indica. */
  tamano: number | null
  conPanceta: boolean
}

export interface GrupoMenu {
  clave: string
  /** Nombre sin tamaño ni «(con panceta)». */
  nombre: string
  /** Ordenadas de menor a mayor tamaño. */
  variantes: Variante[]
}


const RE_PANCETA = /\s*\(con panceta\)\s*$/i
const RE_TAMANO = /\s+x(\d+)\s*$/i

function analizar(product: Product): { base: string; variante: Variante } {
  const conPanceta = RE_PANCETA.test(product.name)
  const sinPanceta = product.name.replace(RE_PANCETA, '')
  const tamano = RE_TAMANO.exec(sinPanceta)
  return {
    base: sinPanceta.replace(RE_TAMANO, '').trim(),
    variante: { product, tamano: tamano ? Number(tamano[1]) : null, conPanceta },
  }
}

/** Junta los productos de una misma categoría con el mismo nombre base. Respeta el orden de la carta. */
export function agruparVariantes(products: Product[]): GrupoMenu[] {
  const grupos = new Map<string, GrupoMenu>()
  for (const product of products) {
    const { base, variante } = analizar(product)
    const clave = `${product.category}|${base.toLowerCase()}`
    const grupo = grupos.get(clave)
    if (grupo) grupo.variantes.push(variante)
    else grupos.set(clave, { clave, nombre: base, variantes: [variante] })
  }
  for (const grupo of grupos.values()) {
    // Si el plato tiene versión sin panceta, la de con panceta no se muestra
    if (grupo.variantes.some((v) => !v.conPanceta)) grupo.variantes = grupo.variantes.filter((v) => !v.conPanceta)
    grupo.variantes.sort((a, b) => (a.tamano ?? 0) - (b.tamano ?? 0))
  }
  return [...grupos.values()]
}

export const tamanosDe = (grupo: GrupoMenu) =>
  [...new Set(grupo.variantes.map((v) => v.tamano))].filter((t): t is number => t !== null)

export function variantePara(grupo: GrupoMenu, tamano?: number | null): Variante {
  return grupo.variantes.find((v) => v.tamano === tamano) ?? grupo.variantes[0]
}

export function etiquetaTamano(tamano: number): string {
  return ({ 1: 'Simple', 2: 'Doble', 3: 'Triple' } as Record<number, string>)[tamano] ?? `x${tamano}`
}

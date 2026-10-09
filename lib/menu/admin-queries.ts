import 'server-only'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { CLAVES_TRANSFERENCIA } from '@/lib/pagos/transferencia'
import { leerDatosLocal } from '@/lib/local/queries'
import { agruparVariantes } from './variantes'

// Lecturas del panel de gestión del menú. Incluyen lo inactivo (el menú público no), pero nunca lo
// borrado: un producto borrado solo queda en la base para el historial de ventas.
// No verifican permisos: las páginas que las usan deben llamar antes a requerirDueno().

export async function listarMenuCompleto() {
  const [categorias, productos] = await Promise.all([
    db
      .select()
      .from(schema.categorias)
      .where(isNull(schema.categorias.borradoEn))
      .orderBy(asc(schema.categorias.orden), asc(schema.categorias.id)),
    db
      .select()
      .from(schema.productos)
      .where(isNull(schema.productos.borradoEn))
      .orderBy(asc(schema.productos.orden), asc(schema.productos.id)),
  ])
  return categorias.map((categoria) => ({
    ...categoria,
    productos: productos.filter((p) => p.categoriaId === categoria.id),
  }))
}

export async function obtenerProducto(id: number) {
  const [producto] = await db
    .select()
    .from(schema.productos)
    .where(and(eq(schema.productos.id, id), isNull(schema.productos.borradoEn)))
  return producto ?? null
}

type ProductoFila = typeof schema.productos.$inferSelect

/**
 * Plato con variantes (tamaños y panceta) al que pertenece un producto: todos los productos de su
 * categoría con el mismo nombre base. null si el producto no existe o está borrado.
 */
export async function obtenerPlato(id: number) {
  const producto = await obtenerProducto(id)
  if (!producto) return null
  const deLaCategoria = await db
    .select()
    .from(schema.productos)
    .where(and(eq(schema.productos.categoriaId, producto.categoriaId), isNull(schema.productos.borradoEn)))
    .orderBy(asc(schema.productos.orden), asc(schema.productos.id))
  const grupos = agruparVariantes<ProductoFila & { name: string; category: string }>(
    deLaCategoria.map((p) => ({ ...p, name: p.nombre, category: String(p.categoriaId) })),
  )
  const grupo = grupos.find((g) => g.variantes.some((v) => v.product.id === id))
  return grupo ? { categoriaId: producto.categoriaId, grupo } : null
}

export async function listarCategorias() {
  return db
    .select()
    .from(schema.categorias)
    .where(isNull(schema.categorias.borradoEn))
    .orderBy(asc(schema.categorias.orden), asc(schema.categorias.id))
}

/** Ajustes editables: hora de corte, cuenta para transferir y datos públicos del local. */
export async function leerAjustes() {
  // Los datos del local se muestran como los ve hoy el cliente (con los valores por defecto aplicados)
  const local = await leerDatosLocal()
  const filas = await db
    .select()
    .from(schema.configuracion)
    .where(inArray(schema.configuracion.clave, ['corte_dia_hora', ...Object.values(CLAVES_TRANSFERENCIA)]))
  const numero = (clave: string, porDefecto: number) => {
    const n = Number(filas.find((f) => f.clave === clave)?.valor)
    return Number.isInteger(n) ? n : porDefecto
  }
  const texto = (clave: string) => filas.find((f) => f.clave === clave)?.valor ?? ''
  return {
    corteHora: numero('corte_dia_hora', 6),
    transferencia: {
      alias: texto(CLAVES_TRANSFERENCIA.alias),
      cbu: texto(CLAVES_TRANSFERENCIA.cbu),
      titular: texto(CLAVES_TRANSFERENCIA.titular),
      banco: texto(CLAVES_TRANSFERENCIA.banco),
    },
    local,
  }
}

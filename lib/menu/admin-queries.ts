import { asc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

// Lecturas del panel de gestión del menú. Incluyen lo inactivo (el menú público no).
// No verifican permisos: las páginas que las usan deben llamar antes a requerirDueno().

export async function listarMenuCompleto() {
  const [categorias, productos] = await Promise.all([
    db.select().from(schema.categorias).orderBy(asc(schema.categorias.orden), asc(schema.categorias.id)),
    db.select().from(schema.productos).orderBy(asc(schema.productos.orden), asc(schema.productos.id)),
  ])
  return categorias.map((categoria) => ({
    ...categoria,
    productos: productos.filter((p) => p.categoriaId === categoria.id),
  }))
}

export async function obtenerProducto(id: number) {
  const [producto] = await db.select().from(schema.productos).where(eq(schema.productos.id, id))
  return producto ?? null
}

export async function listarCategorias() {
  return db.select().from(schema.categorias).orderBy(asc(schema.categorias.orden), asc(schema.categorias.id))
}

/** Ajustes editables: descuento por pedido y hora de corte del día de caja. */
export async function leerAjustes() {
  const filas = await db
    .select()
    .from(schema.configuracion)
    .where(inArray(schema.configuracion.clave, ['descuento_porcentaje', 'corte_dia_hora']))
  const valor = (clave: string, porDefecto: number) => {
    const n = Number(filas.find((f) => f.clave === clave)?.valor)
    return Number.isInteger(n) ? n : porDefecto
  }
  return { descuentoPorcentaje: valor('descuento_porcentaje', 0), corteHora: valor('corte_dia_hora', 6) }
}

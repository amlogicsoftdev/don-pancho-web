import 'server-only'
import { asc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { CLAVES_TRANSFERENCIA } from '@/lib/pagos/transferencia'
import { leerDatosLocal } from '@/lib/local/queries'

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

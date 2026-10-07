import 'server-only'
import { connection } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import type { Category, Product } from '@/lib/types'

// Lectura del menú público desde la base. Solo se usa en el servidor (páginas y Route Handlers).

/** Imagen que se muestra si un producto todavía no tiene foto cargada. */
export const IMAGEN_PRODUCTO_FALLBACK = '/images/logo-don-pancho.webp'

export interface Menu {
  categories: Category[]
  products: Product[]
}

/**
 * Categorías activas que tienen al menos un producto activo, y esos productos,
 * en el orden que define el local. Se lee en cada visita para mostrar siempre
 * los precios vigentes.
 */
export async function obtenerMenu(): Promise<Menu> {
  // Marca la página como dinámica: sin esto, Next la generaría una sola vez al compilar
  await connection()

  const filas = await db
    .select({
      id: schema.productos.id,
      nombre: schema.productos.nombre,
      descripcion: schema.productos.descripcion,
      precio: schema.productos.precio,
      imagenUrl: schema.productos.imagenUrl,
      etiqueta: schema.productos.etiqueta,
      categoriaId: schema.categorias.id,
      categoriaNombre: schema.categorias.nombre,
    })
    .from(schema.productos)
    .innerJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
    .where(and(eq(schema.productos.activo, true), eq(schema.categorias.activa, true)))
    .orderBy(
      asc(schema.categorias.orden),
      asc(schema.categorias.id),
      asc(schema.productos.orden),
      asc(schema.productos.id),
    )

  const categories: Category[] = []
  for (const fila of filas) {
    if (!categories.some((c) => c.id === fila.categoriaId)) {
      categories.push({ id: fila.categoriaId, name: fila.categoriaNombre })
    }
  }

  const products: Product[] = filas.map((fila) => ({
    id: fila.id,
    name: fila.nombre,
    category: fila.categoriaNombre,
    description: fila.descripcion,
    price: fila.precio,
    image: fila.imagenUrl || IMAGEN_PRODUCTO_FALLBACK,
    badge: fila.etiqueta ?? undefined,
  }))

  return { categories, products }
}

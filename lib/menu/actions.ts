'use server'

import { and, asc, eq, max, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requerirDueno } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'
import { CLAVES_TRANSFERENCIA } from '@/lib/pagos/transferencia'
import { esUrlDeCloudinary, firmarSubida as firmarSubidaCloudinary, type FirmaSubida } from './cloudinary'

// Gestión del menú: solo el dueño (CLAUDE.md, sección 9). Cada acción verifica sesión y rol en
// el servidor y valida todo lo que llega. No se borra nada: productos y categorías se desactivan.

export type ResultadoAccion = { ok: true } | { ok: false; error: string }

const PRECIO_MAX = 10_000_000

function refrescar() {
  revalidatePath('/admin/menu')
  // El menú público se lee de la base en cada visita, pero se revalidan igual por las dudas.
  revalidatePath('/menu')
  revalidatePath('/')
}

const idValido = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0

function texto(v: unknown, limite: number): string | null {
  if (typeof v !== 'string') return null
  const limpio = v.trim()
  return limpio.length <= limite ? limpio : null
}

// --- Subida de imágenes ---

export async function pedirFirmaSubida(): Promise<{ ok: true; firma: FirmaSubida } | { ok: false; error: string }> {
  await requerirDueno()
  const firma = firmarSubidaCloudinary()
  if (!firma) {
    return { ok: false, error: 'Cloudinary no está configurado todavía (faltan las claves en el servidor).' }
  }
  return { ok: true, firma }
}

// --- Categorías ---

export async function crearCategoria(nombreCrudo: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  const nombre = texto(nombreCrudo, 60)
  if (!nombre) return { ok: false, error: 'Escribí el nombre de la categoría (hasta 60 caracteres).' }

  const [existente] = await db.select({ id: schema.categorias.id }).from(schema.categorias).where(sql`lower(${schema.categorias.nombre}) = ${nombre.toLowerCase()}`)
  if (existente) return { ok: false, error: 'Ya existe una categoría con ese nombre.' }

  const [{ ultimo }] = await db.select({ ultimo: max(schema.categorias.orden) }).from(schema.categorias)
  await db.insert(schema.categorias).values({ nombre, orden: (ultimo ?? -1) + 1 })
  refrescar()
  return { ok: true }
}

export async function renombrarCategoria(id: unknown, nombreCrudo: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  const nombre = texto(nombreCrudo, 60)
  if (!idValido(id) || !nombre) return { ok: false, error: 'Escribí el nombre de la categoría (hasta 60 caracteres).' }

  const [otra] = await db
    .select({ id: schema.categorias.id })
    .from(schema.categorias)
    .where(sql`lower(${schema.categorias.nombre}) = ${nombre.toLowerCase()} and ${schema.categorias.id} <> ${id}`)
  if (otra) return { ok: false, error: 'Ya existe una categoría con ese nombre.' }

  await db.update(schema.categorias).set({ nombre }).where(eq(schema.categorias.id, id))
  refrescar()
  return { ok: true }
}

export async function alternarCategoria(id: unknown, activa: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(id) || typeof activa !== 'boolean') return { ok: false, error: 'Categoría inválida.' }
  await db.update(schema.categorias).set({ activa }).where(eq(schema.categorias.id, id))
  refrescar()
  return { ok: true }
}

/** Sube o baja una categoría un lugar, renumerando el orden de todas para que nunca se repita. */
export async function moverCategoria(id: unknown, direccion: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(id) || (direccion !== 'arriba' && direccion !== 'abajo')) return { ok: false, error: 'Movimiento inválido.' }

  await db.transaction(async (tx) => {
    const lista = await tx.select({ id: schema.categorias.id }).from(schema.categorias).orderBy(asc(schema.categorias.orden), asc(schema.categorias.id))
    const i = lista.findIndex((c) => c.id === id)
    const j = direccion === 'arriba' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= lista.length) return
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    for (const [orden, c] of lista.entries()) {
      await tx.update(schema.categorias).set({ orden }).where(eq(schema.categorias.id, c.id))
    }
  })
  refrescar()
  return { ok: true }
}

// --- Productos ---

/** Crea o edita un producto (con `id` edita). La imagen es opcional. */
export async function guardarProducto(entrada: unknown): Promise<ResultadoAccion & { id?: number }> {
  await requerirDueno()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'El producto no es válido.' }
  const d = entrada as Record<string, unknown>

  const nombre = texto(d.nombre, 80)
  if (!nombre) return { ok: false, error: 'Escribí el nombre del producto (hasta 80 caracteres).' }
  const descripcion = texto(d.descripcion ?? '', 300)
  if (descripcion === null) return { ok: false, error: 'La descripción es demasiado larga (máximo 300 caracteres).' }
  const etiquetaCruda = texto(d.etiqueta ?? '', 30)
  if (etiquetaCruda === null) return { ok: false, error: 'La etiqueta es demasiado larga (máximo 30 caracteres).' }
  const etiqueta = etiquetaCruda || null

  if (typeof d.precio !== 'number' || !Number.isInteger(d.precio) || d.precio < 1 || d.precio > PRECIO_MAX) {
    return { ok: false, error: 'El precio debe ser un monto en pesos, entero y mayor a cero.' }
  }
  if (!idValido(d.categoriaId)) return { ok: false, error: 'Elegí una categoría.' }
  if (typeof d.activo !== 'boolean') return { ok: false, error: 'Indicá si el producto está activo.' }

  const [categoria] = await db.select({ id: schema.categorias.id }).from(schema.categorias).where(eq(schema.categorias.id, d.categoriaId))
  if (!categoria) return { ok: false, error: 'La categoría elegida no existe.' }

  const id = d.id === undefined || d.id === null ? null : d.id
  if (id !== null && !idValido(id)) return { ok: false, error: 'Producto inválido.' }

  // Imagen: vacía, la que ya tenía el producto o una de nuestra cuenta de Cloudinary.
  let imagenUrl: string | null = null
  if (typeof d.imagenUrl === 'string' && d.imagenUrl.trim() !== '') {
    const url = d.imagenUrl.trim()
    let actual: string | null = null
    if (id !== null) {
      const [fila] = await db.select({ imagenUrl: schema.productos.imagenUrl }).from(schema.productos).where(eq(schema.productos.id, id))
      actual = fila?.imagenUrl ?? null
    }
    if (url !== actual && !esUrlDeCloudinary(url)) {
      return { ok: false, error: 'La imagen tiene que subirse desde el panel (Cloudinary).' }
    }
    imagenUrl = url
  }

  if (id === null) {
    const [{ ultimo }] = await db
      .select({ ultimo: max(schema.productos.orden) })
      .from(schema.productos)
      .where(eq(schema.productos.categoriaId, d.categoriaId))
    const [creado] = await db
      .insert(schema.productos)
      .values({ categoriaId: d.categoriaId, nombre, descripcion, precio: d.precio, imagenUrl, etiqueta, activo: d.activo, orden: (ultimo ?? -1) + 1 })
      .returning({ id: schema.productos.id })
    refrescar()
    return { ok: true, id: creado.id }
  }

  const actualizados = await db
    .update(schema.productos)
    .set({ categoriaId: d.categoriaId, nombre, descripcion, precio: d.precio, imagenUrl, etiqueta, activo: d.activo })
    .where(eq(schema.productos.id, id))
    .returning({ id: schema.productos.id })
  if (actualizados.length === 0) return { ok: false, error: 'El producto no existe.' }
  refrescar()
  return { ok: true, id }
}

export async function alternarProducto(id: unknown, activo: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(id) || typeof activo !== 'boolean') return { ok: false, error: 'Producto inválido.' }
  await db.update(schema.productos).set({ activo }).where(eq(schema.productos.id, id))
  refrescar()
  return { ok: true }
}

/** Sube o baja un producto un lugar dentro de su categoría. */
export async function moverProducto(id: unknown, direccion: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(id) || (direccion !== 'arriba' && direccion !== 'abajo')) return { ok: false, error: 'Movimiento inválido.' }

  await db.transaction(async (tx) => {
    const [producto] = await tx.select({ categoriaId: schema.productos.categoriaId }).from(schema.productos).where(eq(schema.productos.id, id))
    if (!producto) return
    const lista = await tx
      .select({ id: schema.productos.id })
      .from(schema.productos)
      .where(and(eq(schema.productos.categoriaId, producto.categoriaId)))
      .orderBy(asc(schema.productos.orden), asc(schema.productos.id))
    const i = lista.findIndex((p) => p.id === id)
    const j = direccion === 'arriba' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= lista.length) return
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    for (const [orden, p] of lista.entries()) {
      await tx.update(schema.productos).set({ orden }).where(eq(schema.productos.id, p.id))
    }
  })
  refrescar()
  return { ok: true }
}

// --- Ajustes del local ---

/**
 * Descuento por pedido (0–100 %), hora de corte del día de caja (0–23) y datos de la cuenta para
 * transferencias (alias, CBU, titular y banco; todos opcionales).
 */
export async function guardarAjustes(entrada: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'Los ajustes no son válidos.' }
  const d = entrada as Record<string, unknown>

  const descuento = d.descuentoPorcentaje
  const corte = d.corteHora
  if (typeof descuento !== 'number' || !Number.isInteger(descuento) || descuento < 0 || descuento > 100) {
    return { ok: false, error: 'El descuento debe ser un número entero entre 0 y 100.' }
  }
  if (typeof corte !== 'number' || !Number.isInteger(corte) || corte < 0 || corte > 23) {
    return { ok: false, error: 'La hora de corte debe ser un número entero entre 0 y 23.' }
  }

  const alias = texto(d.alias ?? '', 20)
  const cbu = texto(d.cbu ?? '', 22)
  const titular = texto(d.titular ?? '', 80)
  const banco = texto(d.banco ?? '', 60)
  if (alias === null || (alias !== '' && !/^[a-zA-Z0-9.-]{6,20}$/.test(alias))) {
    return { ok: false, error: 'El alias debe tener entre 6 y 20 caracteres: letras, números, puntos o guiones.' }
  }
  if (cbu === null || (cbu !== '' && !/^\d{22}$/.test(cbu))) {
    return { ok: false, error: 'El CBU o CVU debe tener exactamente 22 números.' }
  }
  if (titular === null) return { ok: false, error: 'El nombre del titular es demasiado largo (máximo 80 caracteres).' }
  if (banco === null) return { ok: false, error: 'El nombre del banco es demasiado largo (máximo 60 caracteres).' }

  await db.transaction(async (tx) => {
    // Un dato de transferencia vacío se guarda como texto vacío: el sitio lo trata como "no cargado".
    for (const [clave, valor] of [
      ['descuento_porcentaje', String(descuento)],
      ['corte_dia_hora', String(corte)],
      [CLAVES_TRANSFERENCIA.alias, alias],
      [CLAVES_TRANSFERENCIA.cbu, cbu],
      [CLAVES_TRANSFERENCIA.titular, titular],
      [CLAVES_TRANSFERENCIA.banco, banco],
    ] as const) {
      await tx
        .insert(schema.configuracion)
        .values({ clave, valor })
        .onConflictDoUpdate({ target: schema.configuracion.clave, set: { valor } })
    }
  })
  refrescar()
  revalidatePath('/admin/caja')
  revalidatePath('/admin/pedidos', 'layout')
  return { ok: true }
}

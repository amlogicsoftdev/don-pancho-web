'use server'

import { and, eq, inArray, isNull, max, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requerirDueno } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'
import { CLAVES_TRANSFERENCIA } from '@/lib/pagos/transferencia'
import { CLAVES_LOCAL } from '@/lib/local/datos'
import { telefonoParaWhatsApp } from '@/lib/whatsapp'
import { obtenerPlato } from './admin-queries'
import { esUrlDeCloudinary, firmarSubida as firmarSubidaCloudinary, type FirmaSubida } from './cloudinary'

// Gestión del menú: solo el dueño (CLAUDE.md, sección 9). Cada acción verifica sesión y rol en
// el servidor y valida todo lo que llega. Nada se borra de la base: los productos se dan de baja o
// se marcan como borrados (`borrado_en`), y las categorías se ocultan.

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

/** Link de una red social: vacío (no tienen esa red) o una URL https válida. null = inválido. */
function urlDeRed(v: unknown): string | null {
  const valor = texto(v ?? '', 200)
  if (valor === null || valor === '') return valor
  try {
    return new URL(valor).protocol === 'https:' ? valor : null
  } catch {
    return null
  }
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

  const [existente] = await db
    .select({ id: schema.categorias.id })
    .from(schema.categorias)
    .where(and(sql`lower(${schema.categorias.nombre}) = ${nombre.toLowerCase()}`, isNull(schema.categorias.borradoEn)))
  if (existente) return { ok: false, error: 'Ya existe una categoría con ese nombre.' }

  const [{ ultimo }] = await db.select({ ultimo: max(schema.categorias.orden) }).from(schema.categorias).where(isNull(schema.categorias.borradoEn))
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
    .where(and(sql`lower(${schema.categorias.nombre}) = ${nombre.toLowerCase()} and ${schema.categorias.id} <> ${id}`, isNull(schema.categorias.borradoEn)))
  if (otra) return { ok: false, error: 'Ya existe una categoría con ese nombre.' }

  await db.update(schema.categorias).set({ nombre }).where(and(eq(schema.categorias.id, id), isNull(schema.categorias.borradoEn)))
  refrescar()
  return { ok: true }
}

export async function alternarCategoria(id: unknown, activa: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(id) || typeof activa !== 'boolean') return { ok: false, error: 'Categoría inválida.' }
  await db.update(schema.categorias).set({ activa }).where(and(eq(schema.categorias.id, id), isNull(schema.categorias.borradoEn)))
  refrescar()
  return { ok: true }
}

/**
 * Borra una categoría con todos sus productos. Es un borrado lógico: dejan de verse en el panel y
 * en la carta, pero quedan en la base porque los pedidos viejos nombran a esos productos.
 */
export async function borrarCategoria(id: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(id)) return { ok: false, error: 'Categoría inválida.' }
  const ahora = new Date()
  const borrada = await db.transaction(async (tx) => {
    const [categoria] = await tx
      .update(schema.categorias)
      // El nombre es único: se libera para poder crear otra categoría con el mismo nombre
      .set({ activa: false, borradoEn: ahora, nombre: sql`${schema.categorias.nombre} || ' · borrada #' || ${schema.categorias.id}` })
      .where(and(eq(schema.categorias.id, id), isNull(schema.categorias.borradoEn)))
      .returning({ id: schema.categorias.id })
    if (!categoria) return false
    await tx
      .update(schema.productos)
      .set({ activo: false, borradoEn: ahora })
      .where(and(eq(schema.productos.categoriaId, id), isNull(schema.productos.borradoEn)))
    return true
  })
  refrescar()
  return borrada ? { ok: true } : { ok: false, error: 'La categoría ya no existe.' }
}

/** Lista de ids sin repetidos (el orden en que quedaron en la pantalla). */
function esListaDeIds(v: unknown): v is number[] {
  return Array.isArray(v) && v.length <= 500 && v.every(idValido) && new Set(v).size === v.length
}

/** true si `ids` tiene exactamente los mismos elementos que `actuales`, en cualquier orden. */
function mismosIds(ids: number[], actuales: number[]) {
  const conjunto = new Set(actuales)
  return ids.length === actuales.length && ids.every((id) => conjunto.has(id))
}

const MENU_CAMBIADO = 'El menú cambió mientras lo mirabas. Se actualizó la pantalla; probá de nuevo.'

/**
 * Guarda el orden de las categorías tal como quedó al arrastrarlas. Llega la lista completa:
 * si no coincide con las categorías de la base (alguien agregó una mientras tanto), no se toca nada.
 */
export async function ordenarCategorias(ids: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!esListaDeIds(ids)) return { ok: false, error: 'Orden inválido.' }

  const guardado = await db.transaction(async (tx) => {
    const actuales = await tx.select({ id: schema.categorias.id }).from(schema.categorias).where(isNull(schema.categorias.borradoEn))
    if (!mismosIds(ids, actuales.map((c) => c.id))) return false
    for (const [orden, id] of ids.entries()) {
      await tx.update(schema.categorias).set({ orden }).where(eq(schema.categorias.id, id))
    }
    return true
  })
  refrescar()
  return guardado ? { ok: true } : { ok: false, error: MENU_CAMBIADO }
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

  const [categoria] = await db
    .select({ id: schema.categorias.id })
    .from(schema.categorias)
    .where(and(eq(schema.categorias.id, d.categoriaId), isNull(schema.categorias.borradoEn)))
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
    .where(and(eq(schema.productos.id, id), isNull(schema.productos.borradoEn)))
    .returning({ id: schema.productos.id })
  if (actualizados.length === 0) return { ok: false, error: 'El producto no existe.' }
  refrescar()
  return { ok: true, id }
}

/** Da de baja o de alta productos: uno suelto o todas las variantes de un plato juntas. */
export async function alternarProductos(ids: unknown, activo: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!esListaDeIds(ids) || ids.length === 0 || typeof activo !== 'boolean') return { ok: false, error: 'Producto inválido.' }
  await db
    .update(schema.productos)
    .set({ activo })
    .where(and(inArray(schema.productos.id, ids), isNull(schema.productos.borradoEn)))
  refrescar()
  return { ok: true }
}

/**
 * Borra productos (uno suelto o todas las variantes de un plato). Es un borrado lógico: dejan de
 * verse en el panel y en la carta, pero quedan en la base porque los pedidos viejos los nombran.
 */
export async function borrarProductos(ids: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!esListaDeIds(ids) || ids.length === 0) return { ok: false, error: 'Producto inválido.' }
  await db
    .update(schema.productos)
    .set({ activo: false, borradoEn: new Date() })
    .where(and(inArray(schema.productos.id, ids), isNull(schema.productos.borradoEn)))
  refrescar()
  return { ok: true }
}

/** Nombre de cada variante en la base: «DON CHEESE x2 (con panceta)». La carta los agrupa por esto. */
function nombreVariante(base: string, tamano: number | null, conPanceta: boolean) {
  return `${base}${tamano === null ? '' : ` x${tamano}`}${conPanceta ? ' (con panceta)' : ''}`
}

const precioValido = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= PRECIO_MAX

/**
 * Guarda un plato con variantes de una sola vez: nombre, categoría, foto, etiqueta y alta/baja son
 * comunes; la descripción va por tamaño y el precio por tamaño y panceta. Un precio vacío en una
 * variante que existía la borra (borrado lógico); un precio nuevo crea la variante que faltaba.
 */
export async function guardarPlato(entrada: unknown): Promise<ResultadoAccion & { id?: number }> {
  await requerirDueno()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'El plato no es válido.' }
  const d = entrada as Record<string, unknown>
  if (!idValido(d.id)) return { ok: false, error: 'El plato no es válido.' }

  const plato = await obtenerPlato(d.id)
  if (!plato) return { ok: false, error: 'El plato no existe.' }
  const { variantes } = plato.grupo

  const base = texto(d.nombre, 60)
  if (!base) return { ok: false, error: 'Escribí el nombre del plato (hasta 60 caracteres).' }
  if (/\s+x\d+\s*$|\(con panceta\)/i.test(base)) {
    return { ok: false, error: 'El nombre va sin el tamaño ni «(con panceta)»: eso se arma solo.' }
  }
  const etiquetaCruda = texto(d.etiqueta ?? '', 30)
  if (etiquetaCruda === null) return { ok: false, error: 'La etiqueta es demasiado larga (máximo 30 caracteres).' }
  const etiqueta = etiquetaCruda || null
  if (!idValido(d.categoriaId)) return { ok: false, error: 'Elegí una categoría.' }
  if (typeof d.activo !== 'boolean') return { ok: false, error: 'Indicá si el plato está activo.' }
  const [categoria] = await db
    .select({ id: schema.categorias.id })
    .from(schema.categorias)
    .where(and(eq(schema.categorias.id, d.categoriaId), isNull(schema.categorias.borradoEn)))
  if (!categoria) return { ok: false, error: 'La categoría elegida no existe.' }

  // Imagen: vacía, la que ya tenía alguna variante o una de nuestra cuenta de Cloudinary
  let imagenUrl: string | null = null
  if (typeof d.imagenUrl === 'string' && d.imagenUrl.trim() !== '') {
    const url = d.imagenUrl.trim()
    if (!variantes.some((v) => v.product.imagenUrl === url) && !esUrlDeCloudinary(url)) {
      return { ok: false, error: 'La imagen tiene que subirse desde el panel (Cloudinary).' }
    }
    imagenUrl = url
  }

  // Una fila por cada tamaño que ya tiene el plato, ni más ni menos
  const tamanos = [...new Set(variantes.map((v) => v.tamano))]
  const recargar = { ok: false as const, error: 'Los tamaños del plato cambiaron. Recargá la página.' }
  if (!Array.isArray(d.filas) || d.filas.length !== tamanos.length) return recargar
  const filas: { tamano: number | null; descripcion: string; precio: number | null; precioPanceta: number | null }[] = []
  for (const cruda of d.filas) {
    const f = (cruda ?? {}) as Record<string, unknown>
    const tamano = f.tamano === null ? null : f.tamano
    if (tamano !== null && !idValido(tamano)) return recargar
    if (!tamanos.includes(tamano) || filas.some((x) => x.tamano === tamano)) return recargar
    const descripcion = texto(f.descripcion ?? '', 300)
    if (descripcion === null) return { ok: false, error: 'Una descripción es demasiado larga (máximo 300 caracteres).' }
    const precio = f.precio ?? null
    const precioPanceta = f.precioPanceta ?? null
    if ((precio !== null && !precioValido(precio)) || (precioPanceta !== null && !precioValido(precioPanceta))) {
      return { ok: false, error: 'Cada precio debe ser un monto en pesos, entero y mayor a cero.' }
    }
    filas.push({ tamano, descripcion, precio, precioPanceta })
  }
  if (filas.every((f) => f.precio === null && f.precioPanceta === null)) {
    return { ok: false, error: 'El plato tiene que tener al menos un precio. Para sacarlo de la carta, borralo o dalo de baja.' }
  }

  const comunes = { categoriaId: d.categoriaId, imagenUrl, etiqueta, activo: d.activo }
  const idsQueQuedan: number[] = []
  await db.transaction(async (tx) => {
    for (const fila of filas) {
      for (const conPanceta of [false, true]) {
        const precio = conPanceta ? fila.precioPanceta : fila.precio
        const existente = variantes.find((v) => v.tamano === fila.tamano && v.conPanceta === conPanceta)?.product
        const valores = { ...comunes, nombre: nombreVariante(base, fila.tamano, conPanceta), descripcion: fila.descripcion }
        if (existente && precio !== null) {
          await tx.update(schema.productos).set({ ...valores, precio }).where(eq(schema.productos.id, existente.id))
          idsQueQuedan.push(existente.id)
        } else if (existente) {
          await tx
            .update(schema.productos)
            .set({ activo: false, borradoEn: new Date() })
            .where(eq(schema.productos.id, existente.id))
        } else if (precio !== null) {
          // La variante nueva se ubica junto a las demás del plato
          const [creada] = await tx
            .insert(schema.productos)
            .values({ ...valores, precio, orden: variantes[0].product.orden })
            .returning({ id: schema.productos.id })
          idsQueQuedan.push(creada.id)
        }
      }
    }
  })
  refrescar()
  return { ok: true, id: idsQueQuedan[0] }
}

/** Guarda el orden de los productos de una categoría (la lista completa, como en las categorías). */
export async function ordenarProductos(categoriaId: unknown, ids: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (!idValido(categoriaId) || !esListaDeIds(ids)) return { ok: false, error: 'Orden inválido.' }

  const guardado = await db.transaction(async (tx) => {
    const actuales = await tx
      .select({ id: schema.productos.id })
      .from(schema.productos)
      .where(and(eq(schema.productos.categoriaId, categoriaId), isNull(schema.productos.borradoEn)))
    if (!mismosIds(ids, actuales.map((p) => p.id))) return false
    for (const [orden, id] of ids.entries()) {
      await tx
        .update(schema.productos)
        .set({ orden })
        .where(and(eq(schema.productos.id, id), eq(schema.productos.categoriaId, categoriaId)))
    }
    return true
  })
  refrescar()
  return guardado ? { ok: true } : { ok: false, error: MENU_CAMBIADO }
}

// --- Ajustes del local ---

// --- Ajustes del local: cada hoja de la pantalla se guarda por separado ---

/** Guarda claves de `configuracion` (inserta o reemplaza) en una sola transacción. */
async function guardarClaves(pares: readonly (readonly [string, string])[]) {
  await db.transaction(async (tx) => {
    for (const [clave, valor] of pares) {
      await tx
        .insert(schema.configuracion)
        .values({ clave, valor })
        .onConflictDoUpdate({ target: schema.configuracion.clave, set: { valor } })
    }
  })
  revalidatePath('/admin/ajustes')
}

/** Nombre, WhatsApp, dirección, horario y redes: los ve el cliente en todo el sitio. */
export async function guardarDatosLocal(entrada: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'Los datos no son válidos.' }
  const d = entrada as Record<string, unknown>

  const nombre = texto(d.nombre ?? '', 60)
  const whatsappCrudo = texto(d.whatsapp ?? '', 30)
  const direccion = texto(d.direccion ?? '', 120)
  const horario = texto(d.horario ?? '', 80)
  if (!nombre) return { ok: false, error: 'Ingresá el nombre del local (máximo 60 caracteres).' }
  const whatsapp = whatsappCrudo ? telefonoParaWhatsApp(whatsappCrudo) : ''
  if (!/^549\d{10}$/.test(whatsapp)) {
    return { ok: false, error: 'El WhatsApp debe ser un celular argentino con código de área, por ejemplo 3442 66-8413.' }
  }
  if (!direccion) return { ok: false, error: 'Ingresá la dirección del local (máximo 120 caracteres).' }
  if (!horario) return { ok: false, error: 'Ingresá el horario de atención (máximo 80 caracteres).' }
  const redes = { instagram: urlDeRed(d.instagram), facebook: urlDeRed(d.facebook), tiktok: urlDeRed(d.tiktok) }
  for (const [red, valor] of Object.entries(redes)) {
    if (valor === null) {
      return { ok: false, error: `El link de ${red} debe empezar con https:// (o dejalo vacío si no tienen).` }
    }
  }

  await guardarClaves([
    [CLAVES_LOCAL.nombre, nombre],
    [CLAVES_LOCAL.whatsapp, whatsapp],
    [CLAVES_LOCAL.direccion, direccion],
    [CLAVES_LOCAL.horario, horario],
    [CLAVES_LOCAL.instagram, redes.instagram ?? ''],
    [CLAVES_LOCAL.facebook, redes.facebook ?? ''],
    [CLAVES_LOCAL.tiktok, redes.tiktok ?? ''],
  ])
  // Se muestran en todo el sitio (pie, carrito, seguimiento) y en mensajes y comandas
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Cuenta para transferencias (alias, CBU, titular y banco; todos opcionales). */
export async function guardarCuentaTransferencia(entrada: unknown): Promise<ResultadoAccion> {
  await requerirDueno()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'Los datos no son válidos.' }
  const d = entrada as Record<string, unknown>

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

  // Un dato vacío se guarda como texto vacío: el sitio lo trata como "no cargado"
  await guardarClaves([
    [CLAVES_TRANSFERENCIA.alias, alias],
    [CLAVES_TRANSFERENCIA.cbu, cbu],
    [CLAVES_TRANSFERENCIA.titular, titular],
    [CLAVES_TRANSFERENCIA.banco, banco],
  ])
  revalidatePath('/admin/pedidos', 'layout')
  return { ok: true }
}

/** Hora a la que empieza el día de caja (0–23): define el día en la caja y en los reportes. */
export async function guardarCorteCaja(corte: number): Promise<ResultadoAccion> {
  await requerirDueno()
  if (typeof corte !== 'number' || !Number.isInteger(corte) || corte < 0 || corte > 23) {
    return { ok: false, error: 'La hora de corte debe ser un número entero entre 0 y 23.' }
  }
  await guardarClaves([['corte_dia_hora', String(corte)]])
  revalidatePath('/admin/caja')
  revalidatePath('/admin/ventas')
  return { ok: true }
}

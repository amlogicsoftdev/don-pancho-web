'use server'

import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'
import { crearVentaMostrador, ErrorPedido } from './create'
import { descuentoDeLinea, ESTADOS_ACTIVOS, esPorcentajeValido, pasosDelPedido, sePuedeCancelar, siguienteEstado, type EstadoPedido } from './estados'
import { linkConfirmacion, linkRechazo } from './mensajes'
import { esTiempoEntrega, validarVentaMostrador } from './validate'

// Acciones del panel sobre un pedido. Cada una verifica sesión y rol en el servidor
// (los Server Actions se pueden invocar con un POST directo, no solo desde los botones),
// y relee el estado actual desde la base: nunca confía en lo que muestra la pantalla.
// Pueden hacerlas tanto el empleado como el dueño (tabla de permisos, CLAUDE.md sección 9).

export type ResultadoAccion = { ok: true } | { ok: false; error: string }

const MOTIVO_MIN = 3
const MOTIVO_MAX = 300

function validarMotivo(valor: unknown): { motivo: string } | { error: string } {
  const motivo = typeof valor === 'string' ? valor.trim() : ''
  if (motivo.length < MOTIVO_MIN) return { error: 'Escribí el motivo: es obligatorio.' }
  if (motivo.length > MOTIVO_MAX) return { error: `El motivo es demasiado largo (máximo ${MOTIVO_MAX} caracteres).` }
  return { motivo }
}

function idValido(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0
}

async function leerPedido(id: number) {
  const [pedido] = await db
    .select()
    .from(schema.pedidos)
    .where(and(eq(schema.pedidos.id, id), isNull(schema.pedidos.borradoEn)))
  return pedido ?? null
}

function refrescar() {
  // El layout muestra el contador de pendientes, por eso se revalida todo el panel.
  revalidatePath('/admin', 'layout')
}

/** Avanza el pedido al estado siguiente del flujo (confirmar, en camino, entregado). */
export async function avanzarPedido(id: number): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }

  const nuevo = siguienteEstado(pedido.estado, pedido.modalidad)
  if (!nuevo) return { ok: false, error: 'Este pedido ya no se puede avanzar.' }

  const cambiado = await db.transaction(async (tx) => {
    // La condición sobre `estado` evita que dos personas avancen el mismo pedido a la vez.
    const filas = await tx
      .update(schema.pedidos)
      .set({ estado: nuevo, actualizadoEn: new Date() })
      .where(and(eq(schema.pedidos.id, id), eq(schema.pedidos.estado, pedido.estado), isNull(schema.pedidos.borradoEn)))
      .returning({ id: schema.pedidos.id })
    if (filas.length === 0) return false

    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: id,
      estadoAnterior: pedido.estado,
      estadoNuevo: nuevo,
      usuarioId: usuario.id,
    })
    return true
  })

  refrescar()
  if (!cambiado) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
  return { ok: true }
}

/**
 * Lleva el pedido a cualquier paso de su recorrido, hacia adelante o hacia atrás (por ejemplo,
 * si se marcó "entregado" por error). No reabre pedidos cancelados: eso queda en anulaciones.
 */
export async function cambiarEstado(id: number, destino: EstadoPedido): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (pedido.estado === 'cancelado') return { ok: false, error: 'Un pedido cancelado no se puede reabrir.' }
  if (!pasosDelPedido(pedido.modalidad).includes(destino)) {
    return { ok: false, error: 'Ese estado no corresponde a este pedido.' }
  }
  if (destino === pedido.estado) return { ok: true }

  const cambiado = await db.transaction(async (tx) => {
    // La condición sobre `estado` evita pisar un cambio que otra persona hizo recién.
    const filas = await tx
      .update(schema.pedidos)
      .set({ estado: destino, actualizadoEn: new Date() })
      .where(and(eq(schema.pedidos.id, id), eq(schema.pedidos.estado, pedido.estado), isNull(schema.pedidos.borradoEn)))
      .returning({ id: schema.pedidos.id })
    if (filas.length === 0) return false

    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: id,
      estadoAnterior: pedido.estado,
      estadoNuevo: destino,
      usuarioId: usuario.id,
    })
    return true
  })

  refrescar()
  if (!cambiado) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
  return { ok: true }
}

/**
 * Guarda el descuento de cada línea de un pedido (porcentaje entero, 0 la quita). El total se
 * recalcula acá con los precios guardados en las líneas. Solo mientras el pedido está en curso
 * y, si es por transferencia, antes de confirmar el pago: no se cambia un total que ya se cobró.
 */
export async function aplicarDescuentos(
  id: number,
  descuentos: { itemId: number; porcentaje: number }[],
): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }
  if (!Array.isArray(descuentos) || descuentos.length === 0) return { ok: false, error: 'No hay descuentos para guardar.' }
  for (const d of descuentos) {
    if (typeof d !== 'object' || d === null || !idValido(d.itemId)) return { ok: false, error: 'Producto inválido.' }
    if (!esPorcentajeValido(d.porcentaje)) {
      return { ok: false, error: 'El descuento debe ser un número entero entre 0 y 100.' }
    }
  }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (!ESTADOS_ACTIVOS.includes(pedido.estado)) {
    return { ok: false, error: 'Solo se puede cambiar el descuento de un pedido en curso.' }
  }
  if (pedido.pagoConfirmado) {
    return { ok: false, error: 'La transferencia ya está confirmada: el total no se puede cambiar.' }
  }

  const cambiado = await db.transaction(async (tx) => {
    const items = await tx.select().from(schema.pedidoItems).where(eq(schema.pedidoItems.pedidoId, id))
    const porcentajes = new Map(items.map((i) => [i.id, i.descuentoPorcentaje]))
    for (const d of descuentos) {
      if (!porcentajes.has(d.itemId)) return false // el producto no es de este pedido
      porcentajes.set(d.itemId, d.porcentaje)
    }

    const descuentoMonto = items.reduce(
      (suma, i) => suma + descuentoDeLinea(i.precioUnitario, i.cantidad, porcentajes.get(i.id) ?? 0),
      0,
    )
    // La condición sobre el pago y el estado evita pisar un pedido que cambió mientras tanto.
    const filas = await tx
      .update(schema.pedidos)
      .set({
        // El descuento por pedido quedó atrás: ahora se guarda por línea.
        descuentoPorcentaje: 0,
        descuentoMonto,
        total: pedido.subtotal - descuentoMonto,
        descuentoAplicadoPor: descuentoMonto > 0 ? usuario.id : null,
        descuentoAplicadoEn: descuentoMonto > 0 ? new Date() : null,
        actualizadoEn: new Date(),
      })
      .where(
        and(
          eq(schema.pedidos.id, id),
          eq(schema.pedidos.pagoConfirmado, false),
          inArray(schema.pedidos.estado, [...ESTADOS_ACTIVOS]),
          isNull(schema.pedidos.borradoEn),
        ),
      )
      .returning({ id: schema.pedidos.id })
    if (filas.length === 0) return false

    for (const d of descuentos) {
      await tx
        .update(schema.pedidoItems)
        .set({ descuentoPorcentaje: d.porcentaje })
        .where(and(eq(schema.pedidoItems.id, d.itemId), eq(schema.pedidoItems.pedidoId, id)))
    }
    return true
  })

  refrescar()
  if (!cambiado) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
  return { ok: true }
}

/** Resultado de las acciones que pueden abrir WhatsApp: el link, si hay que avisar al cliente. */
export type ResultadoConAviso = { ok: true; linkWhatsApp: string | null } | { ok: false; error: string }

/**
 * Confirma un pedido pendiente: lo pasa a "en preparación" con el tiempo de entrega que se le
 * informa al cliente. Si `notificar`, devuelve el link de WhatsApp con el mensaje armado.
 */
export async function confirmarPedido(id: number, minutos: number, notificar: boolean): Promise<ResultadoConAviso> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }
  if (!esTiempoEntrega(minutos)) return { ok: false, error: 'Elegí el tiempo de entrega.' }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (pedido.estado !== 'pendiente') return { ok: false, error: 'Este pedido ya estaba confirmado.' }

  const entregaEstimada = new Date(Date.now() + minutos * 60_000)
  const actualizado = await db.transaction(async (tx) => {
    const [fila] = await tx
      .update(schema.pedidos)
      .set({ estado: 'en_preparacion', tiempoEstimadoMin: minutos, entregaEstimada, actualizadoEn: new Date() })
      .where(and(eq(schema.pedidos.id, id), eq(schema.pedidos.estado, 'pendiente'), isNull(schema.pedidos.borradoEn)))
      .returning()
    if (!fila) return null

    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: id,
      estadoAnterior: 'pendiente',
      estadoNuevo: 'en_preparacion',
      usuarioId: usuario.id,
    })
    return fila
  })

  refrescar()
  if (!actualizado) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
  return { ok: true, linkWhatsApp: notificar ? await linkConfirmacion(actualizado) : null }
}

/**
 * Rechaza un pedido pendiente (queda cancelado, con el motivo en anulaciones). Si `notificar`,
 * devuelve el link de WhatsApp con el aviso para el cliente.
 */
export async function rechazarPedido(id: number, motivoCrudo: string, notificar: boolean): Promise<ResultadoConAviso> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }

  const validado = validarMotivo(motivoCrudo)
  if ('error' in validado) return { ok: false, error: validado.error }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (pedido.estado !== 'pendiente') return { ok: false, error: 'Solo se puede rechazar un pedido pendiente.' }

  const resultado = await anularComoCancelado(pedido, validado.motivo, usuario.id)
  if (!resultado.ok) return resultado
  return { ok: true, linkWhatsApp: notificar ? await linkRechazo(pedido, validado.motivo) : null }
}

/** Suma una impresión de las comandas: desde la segunda, salen marcadas como REIMPRESIÓN. */
export async function registrarImpresion(id: number): Promise<ResultadoAccion> {
  await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }

  await db
    .update(schema.pedidos)
    .set({ comandasImpresas: sql`${schema.pedidos.comandasImpresas} + 1` })
    .where(and(eq(schema.pedidos.id, id), isNull(schema.pedidos.borradoEn)))
  revalidatePath(`/admin/pedidos/${id}/comandas`)
  return { ok: true }
}

/** Cancela el pedido. El motivo es obligatorio y queda en el registro de anulaciones. */
export async function cancelarPedido(id: number, motivoCrudo: string): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }

  const validado = validarMotivo(motivoCrudo)
  if ('error' in validado) return { ok: false, error: validado.error }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (!sePuedeCancelar(pedido.estado)) return { ok: false, error: 'Este pedido ya no se puede cancelar.' }

  return anularComoCancelado(pedido, validado.motivo, usuario.id)
}

/** Pasa el pedido a cancelado y deja el motivo en anulaciones (cancelar y rechazar). */
async function anularComoCancelado(
  pedido: NonNullable<Awaited<ReturnType<typeof leerPedido>>>,
  motivo: string,
  usuarioId: string,
): Promise<ResultadoAccion> {
  const cambiado = await db.transaction(async (tx) => {
    const filas = await tx
      .update(schema.pedidos)
      .set({ estado: 'cancelado', actualizadoEn: new Date() })
      .where(
        and(eq(schema.pedidos.id, pedido.id), eq(schema.pedidos.estado, pedido.estado), isNull(schema.pedidos.borradoEn)),
      )
      .returning({ id: schema.pedidos.id })
    if (filas.length === 0) return false

    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: pedido.id,
      estadoAnterior: pedido.estado,
      estadoNuevo: 'cancelado',
      usuarioId,
    })
    await tx.insert(schema.anulaciones).values({
      pedidoId: pedido.id,
      numeroPedido: pedido.numero,
      accion: 'cancelado',
      motivo,
      usuarioId,
    })
    return true
  })

  refrescar()
  if (!cambiado) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
  return { ok: true }
}

/**
 * Borra el pedido de la lista (borrado lógico: la fila y su historial se conservan) y deja
 * constancia con el motivo en el registro de anulaciones.
 */
export async function borrarPedido(id: number, motivoCrudo: string): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }

  const validado = validarMotivo(motivoCrudo)
  if ('error' in validado) return { ok: false, error: validado.error }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }

  const cambiado = await db.transaction(async (tx) => {
    const filas = await tx
      .update(schema.pedidos)
      .set({ borradoEn: new Date(), actualizadoEn: new Date() })
      .where(and(eq(schema.pedidos.id, id), isNull(schema.pedidos.borradoEn)))
      .returning({ id: schema.pedidos.id })
    if (filas.length === 0) return false

    await tx.insert(schema.anulaciones).values({
      pedidoId: id,
      numeroPedido: pedido.numero,
      accion: 'borrado',
      motivo: validado.motivo,
      usuarioId: usuario.id,
    })
    return true
  })

  refrescar()
  if (!cambiado) return { ok: false, error: 'El pedido ya estaba borrado.' }
  return { ok: true }
}

/** Marca o desmarca que la transferencia llegó. Solo tiene sentido en pedidos por transferencia. */
export async function confirmarPago(id: number, confirmado: boolean): Promise<ResultadoAccion> {
  await requerirUsuario()
  if (!idValido(id) || typeof confirmado !== 'boolean') return { ok: false, error: 'Pedido inválido.' }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (pedido.metodoPago !== 'transferencia') {
    return { ok: false, error: 'Solo los pedidos por transferencia necesitan confirmar el pago.' }
  }

  await db
    .update(schema.pedidos)
    .set({ pagoConfirmado: confirmado, actualizadoEn: new Date() })
    .where(eq(schema.pedidos.id, id))

  refrescar()
  return { ok: true }
}

export type ResultadoVenta =
  | { ok: true; id: number; numero: number; total: number; linkWhatsApp: string | null }
  | { ok: false; error: string }

/**
 * Carga una venta de mostrador (la hace tanto el empleado como el dueño). Entra confirmada,
 * "en preparación", con su tiempo de entrega. Si `notificar` y hay teléfono, devuelve el link
 * de WhatsApp para avisarle al cliente.
 */
export async function registrarVentaMostrador(entrada: unknown, notificar = false): Promise<ResultadoVenta> {
  const usuario = await requerirUsuario()

  const validado = validarVentaMostrador(entrada)
  if (!validado.ok) return { ok: false, error: validado.error }

  try {
    const creado = await crearVentaMostrador(validado.venta, usuario.id)
    refrescar()
    let link: string | null = null
    if (notificar === true && validado.venta.clienteTelefono) {
      const pedido = await leerPedido(creado.id)
      link = pedido ? await linkConfirmacion(pedido) : null
    }
    return { ok: true, id: creado.id, numero: creado.numero, total: creado.total, linkWhatsApp: link }
  } catch (error) {
    if (error instanceof ErrorPedido) return { ok: false, error: error.message }
    console.error('No se pudo guardar la venta de mostrador', error)
    return { ok: false, error: 'No se pudo guardar la venta. Probá de nuevo.' }
  }
}

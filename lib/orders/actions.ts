'use server'

import { and, eq, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'
import { crearVentaMostrador, ErrorPedido } from './create'
import { ESTADOS_ACTIVOS, pasosDelPedido, sePuedeCancelar, siguienteEstado, type EstadoPedido } from './estados'
import { validarVentaMostrador } from './validate'

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
 * Aplica (o quita, con 0) un descuento en porcentaje a un pedido. El total se recalcula acá
 * con el subtotal guardado. Solo mientras el pedido está en curso y, si es por transferencia,
 * antes de confirmar el pago: no se cambia un total que ya se cobró.
 */
export async function aplicarDescuento(id: number, porcentaje: number): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (!idValido(id)) return { ok: false, error: 'Pedido inválido.' }
  if (typeof porcentaje !== 'number' || !Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    return { ok: false, error: 'El descuento debe ser un número entero entre 0 y 100.' }
  }

  const pedido = await leerPedido(id)
  if (!pedido) return { ok: false, error: 'El pedido no existe.' }
  if (!ESTADOS_ACTIVOS.includes(pedido.estado)) {
    return { ok: false, error: 'Solo se puede cambiar el descuento de un pedido en curso.' }
  }
  if (pedido.pagoConfirmado) {
    return { ok: false, error: 'La transferencia ya está confirmada: el total no se puede cambiar.' }
  }

  const descuentoMonto = Math.round((pedido.subtotal * porcentaje) / 100)
  const filas = await db
    .update(schema.pedidos)
    .set({
      descuentoPorcentaje: porcentaje,
      descuentoMonto,
      total: pedido.subtotal - descuentoMonto,
      descuentoAplicadoPor: porcentaje > 0 ? usuario.id : null,
      descuentoAplicadoEn: porcentaje > 0 ? new Date() : null,
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

  refrescar()
  if (filas.length === 0) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
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

  const cambiado = await db.transaction(async (tx) => {
    const filas = await tx
      .update(schema.pedidos)
      .set({ estado: 'cancelado', actualizadoEn: new Date() })
      .where(and(eq(schema.pedidos.id, id), eq(schema.pedidos.estado, pedido.estado), isNull(schema.pedidos.borradoEn)))
      .returning({ id: schema.pedidos.id })
    if (filas.length === 0) return false

    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: id,
      estadoAnterior: pedido.estado,
      estadoNuevo: 'cancelado',
      usuarioId: usuario.id,
    })
    await tx.insert(schema.anulaciones).values({
      pedidoId: id,
      numeroPedido: pedido.numero,
      accion: 'cancelado',
      motivo: validado.motivo,
      usuarioId: usuario.id,
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

export type ResultadoVenta = { ok: true; id: number; numero: number; total: number } | { ok: false; error: string }

/** Carga una venta de mostrador (la hace tanto el empleado como el dueño). */
export async function registrarVentaMostrador(entrada: unknown): Promise<ResultadoVenta> {
  const usuario = await requerirUsuario()

  const validado = validarVentaMostrador(entrada)
  if (!validado.ok) return { ok: false, error: validado.error }

  try {
    const creado = await crearVentaMostrador(validado.venta, usuario.id)
    refrescar()
    return { ok: true, id: creado.id, numero: creado.numero, total: creado.total }
  } catch (error) {
    if (error instanceof ErrorPedido) return { ok: false, error: error.message }
    console.error('No se pudo guardar la venta de mostrador', error)
    return { ok: false, error: 'No se pudo guardar la venta. Probá de nuevo.' }
  }
}

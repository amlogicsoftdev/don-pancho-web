'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'
import { sePuedeCancelar, siguienteEstado } from './estados'

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

function refrescar(id: number) {
  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${id}`)
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

  refrescar(id)
  if (!cambiado) return { ok: false, error: 'El pedido cambió mientras lo mirabas. Se actualizó la pantalla.' }
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

  refrescar(id)
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

  refrescar(id)
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

  refrescar(id)
  return { ok: true }
}

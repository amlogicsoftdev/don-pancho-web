import 'server-only'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import type { EstadoPedido, ModalidadPedido } from './estados'

// Consulta pública del link de seguimiento (/pedido/[token]). Cualquiera que tenga el link
// lo puede abrir, así que se devuelve solo lo necesario: nada de teléfono, dirección, notas,
// motivos de cancelación ni nombres del personal.

// El token sale de randomBytes(24) en base64url (lib/orders/create.ts): 32 caracteres.
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{32}$/

export interface PedidoSeguimiento {
  numero: number
  estado: EstadoPedido
  modalidad: ModalidadPedido
  metodoPago: 'efectivo' | 'transferencia'
  /** En transferencias: el local ya marcó que la plata llegó. */
  pagoConfirmado: boolean
  /** Solo el primer nombre, para el saludo. */
  nombreCliente: string
  subtotal: number
  descuentoMonto: number
  total: number
  creadoEn: Date
  /** Hora aproximada de entrega (o de retiro) que se le informó al confirmar. */
  entregaEstimada: Date | null
  items: {
    nombre: string
    cantidad: number
    precioUnitario: number
    aclaraciones: string | null
    descuentoPorcentaje: number
  }[]
  /** Cuándo entró el pedido a cada estado. */
  historial: { estado: EstadoPedido; creadoEn: Date }[]
}

/** Pedido para el link de seguimiento, o null si el token no existe o el pedido fue borrado. */
export async function obtenerPedidoPorToken(token: string): Promise<PedidoSeguimiento | null> {
  if (!FORMATO_TOKEN.test(token)) return null

  const [pedido] = await db
    .select({
      id: schema.pedidos.id,
      numero: schema.pedidos.numero,
      estado: schema.pedidos.estado,
      modalidad: schema.pedidos.modalidad,
      metodoPago: schema.pedidos.metodoPago,
      pagoConfirmado: schema.pedidos.pagoConfirmado,
      clienteNombre: schema.pedidos.clienteNombre,
      subtotal: schema.pedidos.subtotal,
      descuentoMonto: schema.pedidos.descuentoMonto,
      total: schema.pedidos.total,
      creadoEn: schema.pedidos.creadoEn,
      entregaEstimada: schema.pedidos.entregaEstimada,
    })
    .from(schema.pedidos)
    .where(and(eq(schema.pedidos.tokenSeguimiento, token), isNull(schema.pedidos.borradoEn)))
  if (!pedido) return null

  const [items, historial] = await Promise.all([
    db
      .select({
        nombre: schema.pedidoItems.nombre,
        cantidad: schema.pedidoItems.cantidad,
        precioUnitario: schema.pedidoItems.precioUnitario,
        aclaraciones: schema.pedidoItems.aclaraciones,
        descuentoPorcentaje: schema.pedidoItems.descuentoPorcentaje,
      })
      .from(schema.pedidoItems)
      .where(eq(schema.pedidoItems.pedidoId, pedido.id))
      .orderBy(asc(schema.pedidoItems.id)),
    db
      .select({ estado: schema.pedidoHistorial.estadoNuevo, creadoEn: schema.pedidoHistorial.creadoEn })
      .from(schema.pedidoHistorial)
      .where(eq(schema.pedidoHistorial.pedidoId, pedido.id))
      .orderBy(asc(schema.pedidoHistorial.id)),
  ])

  return {
    numero: pedido.numero,
    estado: pedido.estado,
    modalidad: pedido.modalidad,
    metodoPago: pedido.metodoPago,
    pagoConfirmado: pedido.pagoConfirmado,
    nombreCliente: pedido.clienteNombre.trim().split(/\s+/)[0] ?? '',
    subtotal: pedido.subtotal,
    descuentoMonto: pedido.descuentoMonto,
    total: pedido.total,
    creadoEn: pedido.creadoEn,
    entregaEstimada: pedido.entregaEstimada,
    items,
    historial,
  }
}

// Los pasos son los mismos que ve el panel (lib/orders/estados.ts)
export { pasosDelPedido } from './estados'

/** Cómo se le explica cada estado al cliente (el panel usa las etiquetas de estados.ts). */
export function textoParaCliente(
  estado: EstadoPedido,
  modalidad: ModalidadPedido,
): { titulo: string; detalle: string } {
  switch (estado) {
    case 'pendiente':
      return { titulo: 'Recibido', detalle: 'El local está revisando tu pedido. Te lo confirmamos por WhatsApp.' }
    case 'en_preparacion':
      return { titulo: 'En preparación', detalle: 'Ya lo estamos cocinando.' }
    case 'listo':
      return { titulo: 'Listo para retirar', detalle: '¡Tu pedido ya está listo! Podés pasar a buscarlo por el local.' }
    case 'en_camino':
      return { titulo: 'En camino', detalle: 'Tu pedido salió para tu dirección.' }
    case 'entregado':
      return modalidad === 'delivery'
        ? { titulo: 'Entregado', detalle: '¡Que lo disfrutes!' }
        : { titulo: 'Retirado', detalle: '¡Que lo disfrutes!' }
    case 'cancelado':
      return {
        titulo: 'Cancelado',
        detalle: 'Tu pedido fue cancelado. Si tenés alguna duda, escribinos por WhatsApp.',
      }
  }
}

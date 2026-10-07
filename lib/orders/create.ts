import 'server-only'
import { randomBytes } from 'node:crypto'
import { and, count, eq, gte, inArray } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import type { ItemPedidoEntrada, PedidoEntrada, VentaMostradorEntrada } from './validate'

// Pedidos seguidos desde un mismo teléfono: protección básica contra pedidos repetidos o falsos.
const VENTANA_MINUTOS = 10
const MAX_PEDIDOS_POR_VENTANA = 3

// Pedidos desde una misma conexión (IP): frena a quien cambia de teléfono en cada pedido.
// Es más alto que el de teléfono porque varias personas pueden compartir la misma red.
const VENTANA_IP_MINUTOS = 60
const MAX_PEDIDOS_POR_IP = 10

export class ErrorPedido extends Error {
  constructor(
    message: string,
    readonly estado: number,
  ) {
    super(message)
  }
}

export interface PedidoCreado {
  id: number
  numero: number
  token: string
  total: number
}

/**
 * Toma los precios de la base (solo productos activos de categorías activas) y calcula
 * subtotal, descuento y total. Del navegador solo se usan ids y cantidades.
 */
async function calcularLineas(items: ItemPedidoEntrada[], descuentoPorcentaje: number) {
  const ids = [...new Set(items.map((i) => i.productoId))]
  const productos = await db
    .select({
      id: schema.productos.id,
      nombre: schema.productos.nombre,
      precio: schema.productos.precio,
    })
    .from(schema.productos)
    .innerJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
    .where(
      and(
        inArray(schema.productos.id, ids),
        eq(schema.productos.activo, true),
        eq(schema.categorias.activa, true),
      ),
    )
  const porId = new Map(productos.map((p) => [p.id, p]))
  if (porId.size !== ids.length) {
    throw new ErrorPedido('Algún producto ya no está disponible. Actualizá el menú y volvé a armar el pedido.', 409)
  }

  const lineas = items.map((item) => {
    const producto = porId.get(item.productoId)!
    return {
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: item.cantidad,
      aclaraciones: item.aclaraciones,
    }
  })

  const subtotal = lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0)
  // El descuento se decide en cada pedido (mostrador o detalle del pedido), nunca en el navegador del cliente
  const descuentoMonto = Math.round((subtotal * descuentoPorcentaje) / 100)
  return { lineas, subtotal, descuentoPorcentaje, descuentoMonto, total: subtotal - descuentoMonto }
}

/**
 * Guarda un pedido de la web como "pendiente". Los precios y el total se toman de la base:
 * del navegador solo llegan ids de producto y cantidades.
 */
export async function crearPedidoWeb(entrada: PedidoEntrada, ipHash: string | null = null): Promise<PedidoCreado> {
  if (ipHash) {
    const desdeIp = new Date(Date.now() - VENTANA_IP_MINUTOS * 60_000)
    const [{ desdeEstaIp }] = await db
      .select({ desdeEstaIp: count() })
      .from(schema.pedidos)
      .where(
        and(
          eq(schema.pedidos.ipHash, ipHash),
          eq(schema.pedidos.origen, 'web'),
          gte(schema.pedidos.creadoEn, desdeIp),
        ),
      )
    if (desdeEstaIp >= MAX_PEDIDOS_POR_IP) {
      throw new ErrorPedido('Se hicieron muchos pedidos desde esta conexión. Probá más tarde o escribinos por WhatsApp.', 429)
    }
  }

  const desde = new Date(Date.now() - VENTANA_MINUTOS * 60_000)
  const [{ recientes }] = await db
    .select({ recientes: count() })
    .from(schema.pedidos)
    .where(
      and(
        eq(schema.pedidos.clienteTelefono, entrada.clienteTelefono),
        eq(schema.pedidos.origen, 'web'),
        gte(schema.pedidos.creadoEn, desde),
      ),
    )
  if (recientes >= MAX_PEDIDOS_POR_VENTANA) {
    throw new ErrorPedido('Hiciste varios pedidos seguidos. Esperá unos minutos o escribinos por WhatsApp.', 429)
  }

  // Los pedidos de la web entran sin descuento: si corresponde, lo aplica el local desde el panel
  const { lineas, subtotal, descuentoPorcentaje, descuentoMonto, total } = await calcularLineas(entrada.items, 0)
  const token = randomBytes(24).toString('base64url')

  const { id, numero } = await db.transaction(async (tx) => {
    const [pedido] = await tx
      .insert(schema.pedidos)
      .values({
        tokenSeguimiento: token,
        origen: 'web',
        estado: 'pendiente',
        modalidad: entrada.modalidad,
        metodoPago: entrada.metodoPago,
        clienteNombre: entrada.clienteNombre,
        clienteTelefono: entrada.clienteTelefono,
        direccion: entrada.direccion,
        referencia: entrada.referencia,
        notas: entrada.notas,
        subtotal,
        descuentoPorcentaje,
        descuentoMonto,
        total,
        ipHash,
      })
      .returning({ id: schema.pedidos.id, numero: schema.pedidos.numero })

    await tx.insert(schema.pedidoItems).values(lineas.map((l) => ({ ...l, pedidoId: pedido.id })))
    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: pedido.id,
      estadoAnterior: null,
      estadoNuevo: 'pendiente',
      usuarioId: null,
    })
    return { id: pedido.id, numero: pedido.numero }
  })

  return { id, numero, token, total }
}

/**
 * Guarda una venta de mostrador: entra al sistema ya entregada y cobrada, a nombre de quien la
 * cargó, así suma sola a los reportes y al cierre de caja.
 */
export async function crearVentaMostrador(entrada: VentaMostradorEntrada, usuarioId: string): Promise<PedidoCreado> {
  // En el mostrador el descuento se carga junto con la venta (se cobra en el momento)
  const { lineas, subtotal, descuentoPorcentaje, descuentoMonto, total } = await calcularLineas(
    entrada.items,
    entrada.descuentoPorcentaje,
  )
  const token = randomBytes(24).toString('base64url')

  const { id, numero } = await db.transaction(async (tx) => {
    const [pedido] = await tx
      .insert(schema.pedidos)
      .values({
        tokenSeguimiento: token,
        origen: 'mostrador',
        estado: 'entregado',
        modalidad: 'retiro',
        metodoPago: entrada.metodoPago,
        // En el mostrador se cobra en el momento.
        pagoConfirmado: true,
        clienteNombre: entrada.clienteNombre ?? 'Mostrador',
        clienteTelefono: '',
        notas: entrada.notas,
        subtotal,
        descuentoPorcentaje,
        descuentoMonto,
        descuentoAplicadoPor: descuentoPorcentaje > 0 ? usuarioId : null,
        descuentoAplicadoEn: descuentoPorcentaje > 0 ? new Date() : null,
        total,
        creadoPor: usuarioId,
      })
      .returning({ id: schema.pedidos.id, numero: schema.pedidos.numero })

    await tx.insert(schema.pedidoItems).values(lineas.map((l) => ({ ...l, pedidoId: pedido.id })))
    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: pedido.id,
      estadoAnterior: null,
      estadoNuevo: 'entregado',
      usuarioId,
    })
    return { id: pedido.id, numero: pedido.numero }
  })

  return { id, numero, token, total }
}

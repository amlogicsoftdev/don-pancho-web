import { randomBytes } from 'node:crypto'
import { and, count, eq, gte, inArray } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import type { PedidoEntrada } from './validate'

// Pedidos seguidos desde un mismo teléfono: protección básica contra pedidos repetidos o falsos.
const VENTANA_MINUTOS = 10
const MAX_PEDIDOS_POR_VENTANA = 3

export class ErrorPedido extends Error {
  constructor(
    message: string,
    readonly estado: number,
  ) {
    super(message)
  }
}

export interface PedidoCreado {
  numero: number
  token: string
  total: number
}

async function leerDescuentoPorcentaje(): Promise<number> {
  const [fila] = await db
    .select({ valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(eq(schema.configuracion.clave, 'descuento_porcentaje'))
  const porcentaje = Number(fila?.valor ?? 0)
  // Nunca confiar ciegamente en lo guardado: se acota a 0–100.
  return Number.isInteger(porcentaje) && porcentaje >= 0 && porcentaje <= 100 ? porcentaje : 0
}

/**
 * Guarda un pedido de la web como "pendiente". Los precios y el total se toman de la base:
 * del navegador solo llegan ids de producto y cantidades.
 */
export async function crearPedidoWeb(entrada: PedidoEntrada): Promise<PedidoCreado> {
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

  const ids = [...new Set(entrada.items.map((i) => i.productoId))]
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

  const lineas = entrada.items.map((item) => {
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
  const descuentoPorcentaje = await leerDescuentoPorcentaje()
  const descuentoMonto = Math.round((subtotal * descuentoPorcentaje) / 100)
  const total = subtotal - descuentoMonto

  const token = randomBytes(24).toString('base64url')

  const numero = await db.transaction(async (tx) => {
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
      })
      .returning({ id: schema.pedidos.id, numero: schema.pedidos.numero })

    await tx.insert(schema.pedidoItems).values(lineas.map((l) => ({ ...l, pedidoId: pedido.id })))
    await tx.insert(schema.pedidoHistorial).values({
      pedidoId: pedido.id,
      estadoAnterior: null,
      estadoNuevo: 'pendiente',
      usuarioId: null,
    })
    return pedido.numero
  })

  return { numero, token, total }
}

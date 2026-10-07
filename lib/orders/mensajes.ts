import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { leerDatosTransferencia } from '@/lib/pagos/transferencia'
import { urlDelSitio } from '@/lib/url-sitio'
import { linkWhatsApp, mensajeConfirmacion, mensajeRechazo } from '@/lib/whatsapp'
import { leerNombreLocal } from './queries'

// Links de WhatsApp al cliente, armados siempre con los datos guardados del pedido.
// No verifican permisos: los llaman acciones y páginas del panel que ya pasaron una guarda.

type Pedido = typeof schema.pedidos.$inferSelect

/** Link para avisarle al cliente que su pedido está confirmado, o null si no dejó teléfono. */
export async function linkConfirmacion(pedido: Pedido): Promise<string | null> {
  if (!pedido.clienteTelefono) return null

  const [items, nombreLocal, sitio, datosTransferencia] = await Promise.all([
    db
      .select({
        nombre: schema.pedidoItems.nombre,
        cantidad: schema.pedidoItems.cantidad,
        aclaraciones: schema.pedidoItems.aclaraciones,
      })
      .from(schema.pedidoItems)
      .where(eq(schema.pedidoItems.pedidoId, pedido.id))
      .orderBy(asc(schema.pedidoItems.id)),
    leerNombreLocal(),
    urlDelSitio(),
    pedido.metodoPago === 'transferencia' && !pedido.pagoConfirmado ? leerDatosTransferencia() : null,
  ])

  return linkWhatsApp(
    pedido.clienteTelefono,
    mensajeConfirmacion(
      {
        numero: pedido.numero,
        clienteNombre: pedido.clienteNombre,
        modalidad: pedido.modalidad,
        metodoPago: pedido.metodoPago,
        direccion: pedido.direccion,
        total: pedido.total,
        items,
        linkSeguimiento: `${sitio}/pedido/${pedido.tokenSeguimiento}`,
        datosTransferencia,
        tiempoEstimadoMin: pedido.tiempoEstimadoMin,
        entregaEstimada: pedido.entregaEstimada,
      },
      nombreLocal,
    ),
  )
}

/** Link para avisarle al cliente que su pedido no se puede tomar, o null si no dejó teléfono. */
export async function linkRechazo(pedido: Pedido, motivo: string): Promise<string | null> {
  if (!pedido.clienteTelefono) return null
  return linkWhatsApp(pedido.clienteTelefono, mensajeRechazo(pedido, motivo, await leerNombreLocal()))
}

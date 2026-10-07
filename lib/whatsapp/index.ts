import {
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  etiquetaTiempo,
  formatearHora,
  formatearNumero,
  formatearPrecio,
} from '@/lib/orders/estados'
import type { ModalidadPedido } from '@/lib/orders/estados'
import type { DatosTransferencia } from '@/lib/pagos/transferencia'

/**
 * Lleva un teléfono argentino al formato internacional de WhatsApp: 549 + área + número,
 * sin 0 inicial. Acepta lo que escribe el cliente: "0 3442 66-8413", "+54 9 3442 668413", etc.
 *
 * Limitación: si el cliente escribió el "15" del celular después del código de área
 * ("3442 15 668413") no se puede quitar sin conocer el largo del área; en ese caso se lo deja
 * y el empleado debe revisarlo antes de enviar.
 */
export function telefonoParaWhatsApp(telefono: string): string {
  let digitos = telefono.replace(/\D/g, '')
  digitos = digitos.replace(/^0+/, '')
  if (digitos.startsWith('54')) {
    digitos = digitos.slice(2)
    if (digitos.startsWith('9')) digitos = digitos.slice(1)
  }
  return `549${digitos}`
}

export interface DatosMensaje {
  numero: number
  clienteNombre: string
  modalidad: ModalidadPedido
  metodoPago: keyof typeof ETIQUETA_PAGO
  direccion: string | null
  total: number
  items: { nombre: string; cantidad: number; aclaraciones: string | null }[]
  /** Link absoluto a /pedido/[token] para que el cliente siga el estado. */
  linkSeguimiento?: string
  /** Cuenta del local: se agrega al mensaje solo si el pago es por transferencia. */
  datosTransferencia?: DatosTransferencia | null
  /** Tiempo de entrega informado al confirmar, y la hora que resulta. */
  tiempoEstimadoMin?: number | null
  entregaEstimada?: Date | null
}

/** "Juan Pérez" → "Juan". Las ventas de mostrador sin nombre no llevan saludo con nombre. */
function saludo(nombre: string): string {
  const primero = nombre.trim().split(/\s+/)[0]
  return primero && primero !== 'Mostrador' ? `¡Hola ${primero}!` : '¡Hola!'
}

/** Líneas con los datos de la cuenta para transferir, o ninguna si no hay datos cargados. */
function lineasTransferencia(datos: DatosTransferencia | null | undefined): string[] {
  if (!datos) return []
  return [
    ...(datos.alias ? [`Alias: ${datos.alias}`] : []),
    ...(datos.cbu ? [`CBU: ${datos.cbu}`] : []),
    ...(datos.titular ? [`Titular: ${datos.titular}${datos.banco ? ` · ${datos.banco}` : ''}`] : []),
    'Mandanos el comprobante por acá 🙌',
  ]
}

/** Mensaje de confirmación que se le manda al cliente desde el WhatsApp del local. */
export function mensajeConfirmacion(pedido: DatosMensaje, nombreLocal: string): string {
  const lineas = pedido.items.map(
    (i) => `• ${i.cantidad}x ${i.nombre}${i.aclaraciones ? ` (${i.aclaraciones})` : ''}`,
  )
  const entrega =
    pedido.modalidad === 'delivery'
      ? `🛵 ${ETIQUETA_MODALIDAD.delivery}${pedido.direccion ? ` a ${pedido.direccion}` : ''}`
      : `🏪 ${ETIQUETA_MODALIDAD.retiro}`

  const tiempo =
    pedido.tiempoEstimadoMin && pedido.entregaEstimada
      ? `⏱ Tiempo estimado: ${etiquetaTiempo(pedido.tiempoEstimadoMin)} (${
          pedido.modalidad === 'delivery' ? 'llega' : 'listo para retirar'
        } aprox. a las ${formatearHora(pedido.entregaEstimada)})`
      : null

  return [
    `${saludo(pedido.clienteNombre)} Te escribimos de ${nombreLocal} 🍔`,
    `Confirmamos tu pedido N° ${formatearNumero(pedido.numero)}:`,
    '',
    ...lineas,
    '',
    entrega,
    ...(tiempo ? [tiempo] : []),
    `💳 Pago: ${ETIQUETA_PAGO[pedido.metodoPago]}`,
    ...(pedido.metodoPago === 'transferencia' ? lineasTransferencia(pedido.datosTransferencia) : []),
    `💰 Total: ${formatearPrecio(pedido.total)}`,
    '',
    `¡Ya lo estamos preparando! Gracias por tu compra. ${nombreLocal}`,
    ...(pedido.linkSeguimiento ? ['', `📍 Seguí tu pedido acá: ${pedido.linkSeguimiento}`] : []),
  ].join('\n')
}

/** Aviso al cliente cuando el local no puede tomar el pedido. */
export function mensajeRechazo(
  pedido: { numero: number; clienteNombre: string },
  motivo: string,
  nombreLocal: string,
): string {
  return [
    `${saludo(pedido.clienteNombre)} Te escribimos de ${nombreLocal}.`,
    `Lamentablemente no podemos tomar tu pedido N° ${formatearNumero(pedido.numero)}.`,
    `Motivo: ${motivo}.`,
    '',
    'Disculpá las molestias. Cualquier duda, escribinos por acá.',
  ].join('\n')
}

export function linkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefonoParaWhatsApp(telefono)}?text=${encodeURIComponent(mensaje)}`
}

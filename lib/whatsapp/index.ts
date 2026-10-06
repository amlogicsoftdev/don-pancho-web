import { ETIQUETA_MODALIDAD, ETIQUETA_PAGO, formatearNumero, formatearPrecio } from '@/lib/orders/estados'
import type { ModalidadPedido } from '@/lib/orders/estados'

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

  return [
    `¡Hola ${pedido.clienteNombre}! Te escribimos de ${nombreLocal} 🍔`,
    `Confirmamos tu pedido N° ${formatearNumero(pedido.numero)}:`,
    '',
    ...lineas,
    '',
    entrega,
    `💳 Pago: ${ETIQUETA_PAGO[pedido.metodoPago]}`,
    `💰 Total: ${formatearPrecio(pedido.total)}`,
    '',
    '¡Ya lo estamos preparando! Gracias por elegirnos.',
  ].join('\n')
}

export function linkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefonoParaWhatsApp(telefono)}?text=${encodeURIComponent(mensaje)}`
}

// Estados del pedido, transiciones permitidas y formatos de presentación.
// Las transiciones se validan en el servidor (actions.ts); este archivo no toca la base.

export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado'
export type ModalidadPedido = 'delivery' | 'retiro'

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ETIQUETA_MODALIDAD: Record<ModalidadPedido, string> = {
  delivery: 'Delivery',
  retiro: 'Retiro en el local',
}

export const ETIQUETA_PAGO = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
} as const

export const ESTADOS_ACTIVOS: readonly EstadoPedido[] = ['pendiente', 'en_preparacion', 'en_camino']

/** Pasos que recorre un pedido según la modalidad (el retiro no pasa por "en camino"). */
export function pasosDelPedido(modalidad: ModalidadPedido): EstadoPedido[] {
  return modalidad === 'delivery'
    ? ['pendiente', 'en_preparacion', 'en_camino', 'entregado']
    : ['pendiente', 'en_preparacion', 'entregado']
}

/**
 * Flujo normal: pendiente → en_preparacion → en_camino (solo delivery) → entregado.
 * Devuelve el próximo estado, o null si el pedido ya terminó.
 */
export function siguienteEstado(estado: EstadoPedido, modalidad: ModalidadPedido): EstadoPedido | null {
  switch (estado) {
    case 'pendiente':
      return 'en_preparacion'
    case 'en_preparacion':
      return modalidad === 'delivery' ? 'en_camino' : 'entregado'
    case 'en_camino':
      return 'entregado'
    default:
      return null
  }
}

/** Un pedido se puede cancelar mientras no esté entregado ni cancelado. */
export function sePuedeCancelar(estado: EstadoPedido): boolean {
  return ESTADOS_ACTIVOS.includes(estado)
}

/** Texto del botón que avanza el pedido. */
export function etiquetaAvance(estado: EstadoPedido, modalidad: ModalidadPedido): string | null {
  const siguiente = siguienteEstado(estado, modalidad)
  switch (siguiente) {
    case 'en_preparacion':
      return 'Confirmar y pasar a preparación'
    case 'en_camino':
      return 'Marcar en camino'
    case 'entregado':
      return modalidad === 'delivery' ? 'Marcar entregado' : 'Marcar retirado'
    default:
      return null
  }
}

/** Número legible del pedido: 152 → "0152". */
export const formatearNumero = (numero: number) => String(numero).padStart(4, '0')

export const formatearPrecio = (valor: number) =>
  valor < 0 ? `-$${(-valor).toLocaleString('es-AR')}` : `$${valor.toLocaleString('es-AR')}`

const ZONA = 'America/Argentina/Buenos_Aires'

/** Fecha y hora en horario de Buenos Aires */
export function formatearFechaHora(fecha: Date): string {
  const f = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
  return f.replace(',', '')
}

export function formatearHora(fecha: Date): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false }).format(fecha)
}

export function formatearSoloFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric' }).format(fecha)
}

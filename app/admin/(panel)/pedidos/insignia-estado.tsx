import { ETIQUETA_ESTADO, type EstadoPedido } from '@/lib/orders/estados'

/** Etiqueta con el estado del pedido. El color de cada estado está en app/globals.css (.pn-tag). */
export function InsigniaEstado({ estado, grande = false }: { estado: EstadoPedido; grande?: boolean }) {
  return (
    <span className={`pn-tag ${grande ? 'pn-tag--lg' : ''}`} data-estado={estado}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  )
}

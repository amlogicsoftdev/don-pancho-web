import { ETIQUETA_ESTADO, type EstadoPedido } from '@/lib/orders/estados'

const COLOR: Record<EstadoPedido, string> = {
  pendiente: 'bg-amber-400/20 text-amber-300',
  en_preparacion: 'bg-sky-400/20 text-sky-300',
  en_camino: 'bg-violet-400/20 text-violet-300',
  entregado: 'bg-emerald-400/20 text-emerald-300',
  cancelado: 'bg-rose-400/20 text-rose-300',
}

export function InsigniaEstado({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${COLOR[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>
  )
}

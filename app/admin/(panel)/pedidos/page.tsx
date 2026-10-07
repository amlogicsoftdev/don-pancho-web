import Link from 'next/link'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  formatearSoloFecha,
} from '@/lib/orders/estados'
import { esFiltro, listarPedidos, type FiltroPedidos } from '@/lib/orders/queries'
import { Encabezado } from '../encabezado'
import { InsigniaEstado } from './insignia-estado'

const PESTANAS: { filtro: FiltroPedidos; titulo: string }[] = [
  { filtro: 'activos', titulo: 'Activos' },
  { filtro: 'entregados', titulo: 'Entregados' },
  { filtro: 'cancelados', titulo: 'Cancelados' },
  { filtro: 'todos', titulo: 'Todos' },
]

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  await requerirUsuario()
  const { filtro: filtroCrudo } = await searchParams
  const filtro: FiltroPedidos = esFiltro(filtroCrudo) ? filtroCrudo : 'activos'
  const pedidos = await listarPedidos(filtro)

  return (
    <section className="mx-auto max-w-4xl">
      <Encabezado titulo="Pedidos">
        <nav className="grid grid-cols-2 gap-2 sm:flex" aria-label="Filtrar pedidos">
          {PESTANAS.map((p) => (
            <Link
              key={p.filtro}
              href={p.filtro === 'activos' ? '/admin/pedidos' : `/admin/pedidos?filtro=${p.filtro}`}
              aria-current={p.filtro === filtro ? 'page' : undefined}
              className="pn-option"
            >
              {p.titulo}
            </Link>
          ))}
        </nav>
      </Encabezado>

      {pedidos.length === 0 ? (
        <p className="pn-card pn-muted mt-6 p-8 text-center font-semibold">No hay pedidos en esta lista.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((p) => (
            <li key={p.id}>
              {/* Cada pedido es un renglón entero para tocar: número, quién y cómo, y a la derecha el total */}
              <Link
                href={`/admin/pedidos/${p.id}`}
                className="pn-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 transition-[border-color] duration-200 hover:border-pancho-black focus-visible:border-pancho-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pancho-black sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-6 sm:p-5"
              >
                <p className="w-20 font-display text-4xl leading-none text-pancho-red-deep sm:w-26 sm:text-5xl">
                  <span className="pn-eyebrow block font-sans">Pedido N°</span>
                  {formatearNumero(p.numero)}
                </p>

                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="truncate text-lg leading-tight font-bold">{p.clienteNombre}</span>
                    <InsigniaEstado estado={p.estado} />
                  </p>
                  <p className="pn-muted mt-1 text-sm font-medium">
                    {ETIQUETA_MODALIDAD[p.modalidad]} · {ETIQUETA_PAGO[p.metodoPago]}
                    {p.metodoPago === 'transferencia' && (p.pagoConfirmado ? ' (pago confirmado)' : ' (pago sin confirmar)')}
                  </p>
                </div>

                <div className="col-span-2 flex items-baseline justify-between gap-3 border-t-2 border-dotted border-pancho-black/20 pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
                  <p className="font-display text-3xl leading-none">{formatearPrecio(p.total)}</p>
                  <p className="pn-muted text-xs font-semibold sm:mt-1.5">
                    {formatearHora(p.creadoEn)} · {formatearSoloFecha(p.creadoEn)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

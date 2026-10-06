import Link from 'next/link'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ETIQUETA_ESTADO,
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  formatearSoloFecha,
} from '@/lib/orders/estados'
import { esFiltro, listarPedidos, type FiltroPedidos } from '@/lib/orders/queries'
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
      <h1 className="mb-4 text-3xl">Pedidos</h1>

      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar pedidos">
        {PESTANAS.map((p) => (
          <Link
            key={p.filtro}
            href={p.filtro === 'activos' ? '/admin/pedidos' : `/admin/pedidos?filtro=${p.filtro}`}
            aria-current={p.filtro === filtro ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              p.filtro === filtro
                ? 'border-cheesy-yellow bg-cheesy-yellow text-cheesy-black'
                : 'border-white/15 text-cheesy-muted hover:text-cheesy-cream'
            }`}
          >
            {p.titulo}
          </Link>
        ))}
      </nav>

      {pedidos.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-cheesy-surface p-6 text-center text-cheesy-muted">
          No hay pedidos en esta lista.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/pedidos/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-cheesy-surface p-4 hover:border-cheesy-yellow/60"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="font-display text-xl text-cheesy-yellow">N° {formatearNumero(p.numero)}</span>
                    <InsigniaEstado estado={p.estado} />
                  </p>
                  <p className="mt-1 truncate font-semibold">{p.clienteNombre}</p>
                  <p className="text-sm text-cheesy-muted">
                    {ETIQUETA_MODALIDAD[p.modalidad]} · {ETIQUETA_PAGO[p.metodoPago]}
                    {p.metodoPago === 'transferencia' && (p.pagoConfirmado ? ' (pago confirmado)' : ' (pago sin confirmar)')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl">{formatearPrecio(p.total)}</p>
                  <p className="text-sm text-cheesy-muted">
                    {formatearHora(p.creadoEn)} · {formatearSoloFecha(p.creadoEn)}
                  </p>
                  <p className="sr-only">{ETIQUETA_ESTADO[p.estado]}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

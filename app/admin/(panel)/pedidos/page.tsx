import { MapPin, Phone, Search, X } from 'lucide-react'
import Link from 'next/link'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ESTADOS_ACTIVOS,
  ETIQUETA_ESTADO,
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  formatearSoloFecha,
} from '@/lib/orders/estados'
import {
  buscarPedidos,
  esFiltro,
  esFiltroEntrega,
  listarPedidos,
  type FiltroEntrega,
  type FiltroPedidos,
} from '@/lib/orders/queries'
import { Encabezado } from '../encabezado'
import { BloquePedidos } from './bloque-pedidos'
import { HaceCuanto } from './hace-cuanto'
import { InsigniaEstado } from './insignia-estado'

const PESTANAS: { filtro: FiltroPedidos; titulo: string }[] = [
  { filtro: 'activos', titulo: 'Activos' },
  { filtro: 'entregados', titulo: 'Entregados' },
  { filtro: 'cancelados', titulo: 'Cancelados' },
  { filtro: 'todos', titulo: 'Todos' },
]

const ENTREGAS: { entrega: FiltroEntrega; titulo: string }[] = [
  { entrega: 'todas', titulo: 'Todos' },
  { entrega: 'delivery', titulo: 'Delivery' },
  { entrega: 'retiro', titulo: 'Retiro' },
]

/** Link de la lista: la pestaña y el filtro de entrega elegidos van en la dirección. */
function hrefLista(filtro: FiltroPedidos, entrega: FiltroEntrega, q?: string) {
  const params = new URLSearchParams()
  if (filtro !== 'activos') params.set('filtro', filtro)
  if (entrega !== 'todas') params.set('entrega', entrega)
  if (q) params.set('q', q)
  const texto = params.toString()
  return texto ? `/admin/pedidos?${texto}` : '/admin/pedidos'
}

type Pedido = Awaited<ReturnType<typeof listarPedidos>>[number]

/** Un pedido es un renglón entero para tocar: número, quién, dónde y cuánto. */
function FilaPedido({ p, activos }: { p: Pedido; activos: boolean }) {
  const pendiente = p.estado === 'pendiente'
  return (
    <li>
      <Link
        href={`/admin/pedidos/${p.id}`}
        className={`pn-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 transition-[border-color] duration-200 hover:border-pancho-black/35 focus-visible:border-pancho-black/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pancho-black sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-6 sm:p-5 ${
          pendiente ? 'border-pancho-orange bg-pancho-orange/10' : ''
        }`}
      >
        <p className="w-20 font-display text-4xl leading-none text-pancho-red-deep sm:w-26 sm:text-5xl">
          <span className="pn-eyebrow block font-sans">{p.origen === 'mostrador' ? 'Mostrador' : 'Pedido N°'}</span>
          {formatearNumero(p.numero)}
        </p>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="truncate text-lg leading-tight font-bold">{p.clienteNombre}</span>
            {/* En "Activos" el estado ya lo dice el bloque */}
            {!activos && <InsigniaEstado estado={p.estado} />}
          </p>
          <p className="pn-muted mt-1 text-sm font-medium">
            {ETIQUETA_MODALIDAD[p.modalidad]} · {ETIQUETA_PAGO[p.metodoPago]}
            {p.metodoPago === 'transferencia' && (p.pagoConfirmado ? ' (pago confirmado)' : ' (pago sin confirmar)')}
          </p>
          {(p.direccion || p.clienteTelefono) && (
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
              {p.direccion && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 flex-none" aria-hidden="true" />
                  <span className="truncate">{p.direccion}</span>
                </span>
              )}
              {p.clienteTelefono && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 flex-none" aria-hidden="true" />
                  {p.clienteTelefono}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="col-span-2 flex items-baseline justify-between gap-3 border-t border-pancho-black/10 pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
          <p className="font-display text-3xl leading-none">{formatearPrecio(p.total)}</p>
          <p className="pn-muted text-xs font-semibold sm:mt-1.5">
            {activos ? (
              <HaceCuanto desde={p.creadoEn.toISOString()} pendiente={pendiente} />
            ) : (
              `${formatearHora(p.creadoEn)} · ${formatearSoloFecha(p.creadoEn)}`
            )}
          </p>
        </div>
      </Link>
    </li>
  )
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; entrega?: string; q?: string }>
}) {
  await requerirUsuario()
  const { filtro: filtroCrudo, entrega: entregaCruda, q } = await searchParams
  const filtro: FiltroPedidos = esFiltro(filtroCrudo) ? filtroCrudo : 'activos'
  const entrega: FiltroEntrega = esFiltroEntrega(entregaCruda) ? entregaCruda : 'todas'
  const busqueda = typeof q === 'string' ? q.trim().slice(0, 80) : ''
  // Con búsqueda se mira en todos los estados; sin búsqueda, la pestaña elegida
  const pedidos = busqueda ? await buscarPedidos(busqueda, entrega) : await listarPedidos(filtro, entrega)
  const activos = !busqueda && filtro === 'activos'

  return (
    <section className="mx-auto max-w-4xl">
      <Encabezado titulo="Pedidos">
        <nav className="grid grid-cols-2 gap-2 sm:flex" aria-label="Filtrar pedidos">
          {PESTANAS.map((p) => (
            <Link
              key={p.filtro}
              href={hrefLista(p.filtro, entrega)}
              aria-current={!busqueda && p.filtro === filtro ? 'page' : undefined}
              className="pn-option"
            >
              {p.titulo}
            </Link>
          ))}
        </nav>
      </Encabezado>

      {/* Cómo se entrega: se combina con la pestaña de arriba y con la búsqueda */}
      <nav className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtrar por entrega">
        <span className="pn-label mb-0">Entrega</span>
        {ENTREGAS.map((e) => (
          <Link
            key={e.entrega}
            href={hrefLista(filtro, e.entrega, busqueda)}
            aria-current={e.entrega === entrega ? 'page' : undefined}
            className="pn-option"
          >
            {e.titulo}
          </Link>
        ))}
      </nav>

      {/* Buscador: número, nombre, teléfono o dirección, en todos los estados */}
      <form method="get" role="search" className="mt-6 flex gap-2">
        {entrega !== 'todas' && <input type="hidden" name="entrega" value={entrega} />}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar pedidos</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            maxLength={80}
            placeholder="Buscar por N°, nombre, teléfono o dirección"
            className="pn-field pl-9"
          />
        </label>
        <button type="submit" className="pn-option">
          Buscar
        </button>
      </form>

      {busqueda && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
          {pedidos.length === 0
            ? `No encontramos pedidos con «${busqueda}».`
            : `${pedidos.length === 50 ? 'Primeros 50 resultados' : `${pedidos.length} ${pedidos.length === 1 ? 'resultado' : 'resultados'}`} para «${busqueda}»`}
          <Link href={hrefLista(filtro, entrega)} className="pn-link inline-flex items-center gap-1">
            <X className="size-3.5" aria-hidden="true" />
            Limpiar búsqueda
          </Link>
        </p>
      )}

      {pedidos.length === 0 ? (
        !busqueda && <p className="pn-card pn-muted mt-6 p-8 text-center font-semibold">No hay pedidos en esta lista.</p>
      ) : activos ? (
        // Activos: un bloque por estado, los pendientes primero (son los que hay que atender)
        <div className="mt-6 space-y-8">
          {ESTADOS_ACTIVOS.map((estado) => {
            const delEstado = pedidos.filter((p) => p.estado === estado)
            if (delEstado.length === 0) return null
            // Los pendientes, del más viejo al más nuevo: primero el que más espera
            const ordenados = estado === 'pendiente' ? [...delEstado].reverse() : delEstado
            return (
              <BloquePedidos key={estado} id={estado} titulo={ETIQUETA_ESTADO[estado]} cantidad={delEstado.length}>
                <ul className="flex flex-col gap-3">
                  {ordenados.map((p) => (
                    <FilaPedido key={p.id} p={p} activos />
                  ))}
                </ul>
              </BloquePedidos>
            )
          })}
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((p) => (
            <FilaPedido key={p.id} p={p} activos={false} />
          ))}
        </ul>
      )}
    </section>
  )
}

import Link from 'next/link'
import { requerirDueno } from '@/lib/auth/guards'
import { diaOperativo, esDiaValido, leerCorteHora, mostrarDia } from '@/lib/caja/dia'
import { reporteVentas, type FiltroVentas } from '@/lib/caja/queries'
import {
  ETIQUETA_ESTADO,
  ETIQUETA_PAGO,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  formatearSoloFecha,
} from '@/lib/orders/estados'

type Parametros = { desde?: string; hasta?: string; origen?: string; metodo?: string }

const CAMPO = 'h-9 rounded-lg border border-white/15 bg-cheesy-black px-2 text-sm'

export default async function VentasPage({ searchParams }: { searchParams: Promise<Parametros> }) {
  await requerirDueno()
  const sp = await searchParams
  const hoy = diaOperativo(new Date(), await leerCorteHora())

  const filtro: FiltroVentas = {
    hasta: esDiaValido(sp.hasta) ? sp.hasta : hoy,
    desde: esDiaValido(sp.desde) ? sp.desde : hoy,
    origen: sp.origen === 'web' || sp.origen === 'mostrador' ? sp.origen : 'todos',
    metodo: sp.metodo === 'efectivo' || sp.metodo === 'transferencia' ? sp.metodo : 'todos',
  }
  // Si el rango viene al revés, se invierte en lugar de mostrar una lista vacía.
  if (filtro.desde > filtro.hasta) [filtro.desde, filtro.hasta] = [filtro.hasta, filtro.desde]

  const reporte = await reporteVentas(filtro)

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-3xl">Ventas</h1>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-cheesy-surface p-4">
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Desde</span>
          <input type="date" name="desde" defaultValue={filtro.desde} className={CAMPO} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Hasta</span>
          <input type="date" name="hasta" defaultValue={filtro.hasta} className={CAMPO} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Origen</span>
          <select name="origen" defaultValue={filtro.origen} className={CAMPO}>
            <option value="todos">Todos</option>
            <option value="web">Web</option>
            <option value="mostrador">Mostrador</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Pago</span>
          <select name="metodo" defaultValue={filtro.metodo} className={CAMPO}>
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <button className="h-9 rounded-lg bg-cheesy-yellow px-4 text-sm font-bold text-cheesy-black">Filtrar</button>
      </form>

      <p className="text-sm text-cheesy-muted">
        Período: {mostrarDia(filtro.desde)} al {mostrarDia(filtro.hasta)}. No incluye pedidos cancelados ni borrados.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
          <p className="text-sm text-cheesy-muted">Ventas ({reporte.cantidad})</p>
          <p className="font-display text-2xl text-cheesy-yellow">{formatearPrecio(reporte.totalVentas)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
          <p className="text-sm text-cheesy-muted">Gastos del período</p>
          <p className="font-display text-2xl">{formatearPrecio(reporte.totalGastos)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
          <p className="text-sm text-cheesy-muted">Ventas menos gastos</p>
          <p className="font-display text-2xl">{formatearPrecio(reporte.totalVentas - reporte.totalGastos)}</p>
        </div>
      </div>
      {(filtro.origen !== 'todos' || filtro.metodo !== 'todos') && (
        <p className="text-xs text-cheesy-muted">
          Con filtros de origen o pago, el total de gastos sigue siendo el de todo el período.
        </p>
      )}

      {reporte.filas.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-cheesy-surface p-6 text-center text-cheesy-muted">
          No hay ventas con estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-cheesy-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-cheesy-muted">
              <tr>
                <th className="p-3">N°</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Pago</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {reporte.filas.map((v) => (
                <tr key={v.id}>
                  <td className="p-3 font-semibold">
                    <Link href={`/admin/pedidos/${v.id}`} className="text-cheesy-yellow hover:underline">
                      {formatearNumero(v.numero)}
                    </Link>
                  </td>
                  <td className="p-3">
                    {formatearSoloFecha(v.creadoEn)} {formatearHora(v.creadoEn)}
                  </td>
                  <td className="p-3">{v.clienteNombre}</td>
                  <td className="p-3">{v.origen === 'web' ? 'Web' : 'Mostrador'}</td>
                  <td className="p-3">
                    {ETIQUETA_PAGO[v.metodoPago]}
                    {v.metodoPago === 'transferencia' && !v.pagoConfirmado && (
                      <span className="text-amber-300"> (sin confirmar)</span>
                    )}
                  </td>
                  <td className="p-3">{ETIQUETA_ESTADO[v.estado]}</td>
                  <td className="p-3 text-right font-semibold">{formatearPrecio(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {reporte.hayMas && (
        <p className="text-sm text-amber-300">
          Se muestran las primeras {reporte.filas.length} de {reporte.cantidad} ventas. Los totales son de todas.
        </p>
      )}
    </section>
  )
}

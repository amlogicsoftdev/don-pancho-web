import { requerirDueno } from '@/lib/auth/guards'
import { diaOperativo, esDiaValido, leerCorteHora, mostrarDia } from '@/lib/caja/dia'
import { listarGastos } from '@/lib/caja/queries'
import { ETIQUETA_PAGO, formatearPrecio } from '@/lib/orders/estados'
import { FormularioGasto } from './formulario-gasto'

export default async function GastosPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  await requerirDueno()
  const sp = await searchParams
  const hoy = diaOperativo(new Date(), await leerCorteHora())
  const hasta = esDiaValido(sp.hasta) ? sp.hasta : hoy
  const desde = esDiaValido(sp.desde) ? sp.desde : `${hoy.slice(0, 8)}01`

  const gastos = await listarGastos(desde, hasta)
  const total = gastos.reduce((suma, g) => suma + g.monto, 0)

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl">Gastos</h1>

      <FormularioGasto diaPorDefecto={hoy} />

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-pancho-surface p-4">
        <label className="text-sm">
          <span className="mb-1 block text-pancho-muted">Desde</span>
          <input type="date" name="desde" defaultValue={desde} className="h-9 rounded-lg border border-white/15 bg-pancho-black px-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-pancho-muted">Hasta</span>
          <input type="date" name="hasta" defaultValue={hasta} className="h-9 rounded-lg border border-white/15 bg-pancho-black px-2" />
        </label>
        <button className="h-9 rounded-lg bg-pancho-orange px-4 text-sm font-bold text-pancho-black">Filtrar</button>
      </form>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg">
          {mostrarDia(desde)} al {mostrarDia(hasta)}
        </h2>
        <p>
          Total: <strong className="font-display text-xl text-pancho-orange">{formatearPrecio(total)}</strong>
        </p>
      </div>

      {gastos.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-pancho-surface p-6 text-center text-pancho-muted">
          No hay gastos en este período.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-pancho-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-pancho-muted">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Pago</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3">Cargó</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td className="p-3">{mostrarDia(g.fecha)}</td>
                  <td className="p-3">{g.descripcion}</td>
                  <td className="p-3">{g.categoria}</td>
                  <td className="p-3">{ETIQUETA_PAGO[g.metodoPago]}</td>
                  <td className="p-3 text-right font-semibold">{formatearPrecio(g.monto)}</td>
                  <td className="p-3">{g.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

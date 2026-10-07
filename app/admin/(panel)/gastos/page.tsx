import { Button } from '@/components/ui/button'
import { requerirDueno } from '@/lib/auth/guards'
import { diaOperativo, esDiaValido, leerCorteHora, mostrarDia } from '@/lib/caja/dia'
import { listarGastos } from '@/lib/caja/queries'
import { ETIQUETA_PAGO, formatearPrecio } from '@/lib/orders/estados'
import { Encabezado } from '../encabezado'
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
    <section className="mx-auto max-w-4xl">
      <Encabezado titulo="Gastos" />

      <div className="mt-6 space-y-8">
        <FormularioGasto diaPorDefecto={hoy} />

        <div className="space-y-4">
          {/* Período de la lista, con el total a la derecha */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <label>
                <span className="pn-label">Desde</span>
                <input type="date" name="desde" defaultValue={desde} className="pn-field w-auto" />
              </label>
              <label>
                <span className="pn-label">Hasta</span>
                <input type="date" name="hasta" defaultValue={hasta} className="pn-field w-auto" />
              </label>
              <Button type="submit" variant="default">
                Filtrar
              </Button>
            </form>
            <p className="text-right">
              <span className="pn-eyebrow block">
                Total del {mostrarDia(desde)} al {mostrarDia(hasta)}
              </span>
              <strong className="font-display text-4xl leading-none font-normal tabular-nums">{formatearPrecio(total)}</strong>
            </p>
          </div>

          {gastos.length === 0 ? (
            <p className="pn-card pn-muted p-8 text-center font-semibold">No hay gastos en este período.</p>
          ) : (
            <div className="pn-card overflow-x-auto">
              <table className="pn-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Pago</th>
                    <th className="text-right">Monto</th>
                    <th>Cargó</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id}>
                      <td>{mostrarDia(g.fecha)}</td>
                      <td className="font-bold">{g.descripcion}</td>
                      <td>{g.categoria}</td>
                      <td>{ETIQUETA_PAGO[g.metodoPago]}</td>
                      <td className="text-right font-extrabold">{formatearPrecio(g.monto)}</td>
                      <td>{g.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

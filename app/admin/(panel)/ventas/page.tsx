import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { requerirDueno } from '@/lib/auth/guards'
import { diaOperativo, esDiaValido, leerCorteHora, mostrarDia } from '@/lib/caja/dia'
import { reporteVentas, type FiltroVentas } from '@/lib/caja/queries'
import { ETIQUETA_PAGO, formatearHora, formatearNumero, formatearPrecio, formatearSoloFecha } from '@/lib/orders/estados'
import { CampoFecha } from '../campo-fecha'
import { Encabezado } from '../encabezado'
import { InsigniaEstado } from '../pedidos/insignia-estado'

type Parametros = { desde?: string; hasta?: string; origen?: string; metodo?: string }

const Cifra = ({ rotulo, valor, destacada }: { rotulo: string; valor: string; destacada?: boolean }) => (
  <div className="pn-card p-5">
    <p className="pn-eyebrow">{rotulo}</p>
    <p className={`mt-2 font-display text-4xl leading-none tabular-nums ${destacada ? 'text-pancho-red-deep' : ''}`}>{valor}</p>
  </div>
)

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
    <section className="mx-auto max-w-5xl">
      <Encabezado
        titulo="Ventas"
        rotulo={`Del ${mostrarDia(filtro.desde)} al ${mostrarDia(filtro.hasta)}`}
        descripcion="No incluye pedidos cancelados ni borrados."
      />

      <div className="mt-6 space-y-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <CampoFecha etiqueta="Desde" name="desde" defaultValue={filtro.desde} className="w-44" />
          <CampoFecha etiqueta="Hasta" name="hasta" defaultValue={filtro.hasta} className="w-44" />
          <label>
            <span className="pn-label">Origen</span>
            <select name="origen" defaultValue={filtro.origen} className="pn-field w-auto">
              <option value="todos">Todos</option>
              <option value="web">Web</option>
              <option value="mostrador">Mostrador</option>
            </select>
          </label>
          <label>
            <span className="pn-label">Pago</span>
            <select name="metodo" defaultValue={filtro.metodo} className="pn-field w-auto">
              <option value="todos">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <Button type="submit" variant="default">
            Filtrar
          </Button>
        </form>

        <div className="grid gap-4 sm:grid-cols-3">
          <Cifra rotulo={`Ventas (${reporte.cantidad})`} valor={formatearPrecio(reporte.totalVentas)} destacada />
          <Cifra rotulo="Gastos del período" valor={formatearPrecio(reporte.totalGastos)} />
          <Cifra rotulo="Ventas menos gastos" valor={formatearPrecio(reporte.totalVentas - reporte.totalGastos)} />
        </div>
        <p className="pn-muted text-xs font-medium">
          Solo figuran las ventas cobradas: efectivo de pedidos entregados, transferencias confirmadas y ventas de
          mostrador (si son delivery en efectivo, al entregarlas). Un pedido aparece acá cuando se cobra.
        </p>
        {(filtro.origen !== 'todos' || filtro.metodo !== 'todos') && (
          <p className="pn-muted text-xs font-medium">
            Con filtros de origen o pago, el total de gastos sigue siendo el de todo el período.
          </p>
        )}

        {reporte.filas.length === 0 ? (
          <p className="pn-card pn-muted p-8 text-center font-semibold">No hay ventas con estos filtros.</p>
        ) : (
          <div className="pn-card overflow-x-auto">
            <table className="pn-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Origen</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {reporte.filas.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/admin/pedidos/${v.id}`} className="pn-link">
                        {formatearNumero(v.numero)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      {formatearSoloFecha(v.creadoEn)} {formatearHora(v.creadoEn)}
                    </td>
                    <td className="font-bold">{v.clienteNombre}</td>
                    <td>{v.origen === 'web' ? 'Web' : 'Mostrador'}</td>
                    <td>
                      {ETIQUETA_PAGO[v.metodoPago]}
                    </td>
                    <td>
                      <InsigniaEstado estado={v.estado} />
                    </td>
                    <td className="text-right font-extrabold">{formatearPrecio(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reporte.hayMas && (
          <p className="pn-alert pn-alert--warn">
            Se muestran las primeras {reporte.filas.length} de {reporte.cantidad} ventas. Los totales son de todas.
          </p>
        )}
      </div>
    </section>
  )
}

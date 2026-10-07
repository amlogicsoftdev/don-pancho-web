import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { requerirUsuario } from '@/lib/auth/guards'
import { diaOperativo, esDiaValido, leerCorteHora, mostrarDia, sumarDias } from '@/lib/caja/dia'
import { buscarCierre, listarCierres, resumenDia } from '@/lib/caja/queries'
import { formatearFechaHora, formatearPrecio } from '@/lib/orders/estados'
import { Encabezado } from '../encabezado'
import { FormularioCierre } from './formulario-cierre'

const Fila = ({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) =>
  destacado ? (
    <div className="flex items-baseline justify-between gap-3 py-3">
      <dt className="font-display text-2xl leading-none">{etiqueta}</dt>
      <dd className="font-display text-4xl leading-none">{valor}</dd>
    </div>
  ) : (
    <div className="flex justify-between gap-3 py-2.5 text-sm font-semibold">
      <dt className="pn-muted">{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  )

export default async function CajaPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const usuario = await requerirUsuario()
  const sp = await searchParams
  const hoy = diaOperativo(new Date(), await leerCorteHora())
  const dia = esDiaValido(sp.dia) ? sp.dia : hoy

  const [resumen, cierre, cierres] = await Promise.all([resumenDia(dia), buscarCierre(dia), listarCierres()])
  const diaEsFuturo = dia > hoy

  return (
    <section className="mx-auto max-w-3xl">
      <Encabezado titulo="Cierre de caja" rotulo={dia === hoy ? `Hoy · ${mostrarDia(dia)}` : mostrarDia(dia)}>
        <nav className="flex items-center gap-2" aria-label="Cambiar de día">
          <Link href={`/admin/caja?dia=${sumarDias(dia, -1)}`} className={buttonVariants({ size: 'sm' })}>
            <ArrowLeft />
            Anterior
          </Link>
          {dia < hoy ? (
            <Link href={`/admin/caja?dia=${sumarDias(dia, 1)}`} className={buttonVariants({ size: 'sm' })}>
              Siguiente
              <ArrowRight />
            </Link>
          ) : (
            <span className="pn-tag pn-tag--lg">Hoy</span>
          )}
        </nav>
      </Encabezado>

      <div className="mt-6 space-y-6">
        {resumen.sinEntregar > 0 && (
          <p className="pn-alert pn-alert--warn">
            Hay {resumen.sinEntregar} {resumen.sinEntregar === 1 ? 'pedido' : 'pedidos'} de este día sin entregar. El
            efectivo recién se cobra al entregarlos: conviene cerrar la caja cuando estén todos resueltos.
          </p>
        )}

        <dl className="pn-card pn-rows tabular-nums px-5 py-2 sm:px-6">
          <Fila
            etiqueta={`Ventas del día (${resumen.cantidadVentas})`}
            valor={formatearPrecio(resumen.ventasEfectivo + resumen.transferenciasConfirmadas)}
            destacado
          />
          <Fila etiqueta="Efectivo" valor={formatearPrecio(resumen.ventasEfectivo)} />
          <Fila etiqueta="Transferencias confirmadas" valor={formatearPrecio(resumen.transferenciasConfirmadas)} />
          {resumen.cantidadPorConfirmar > 0 && (
            <Fila
              etiqueta={`Transferencias por confirmar (${resumen.cantidadPorConfirmar}, no suman)`}
              valor={formatearPrecio(resumen.transferenciasPorConfirmar)}
            />
          )}
          <Fila etiqueta="Gastos en efectivo" valor={`-${formatearPrecio(resumen.gastosEfectivo)}`} />
          {resumen.gastosTransferencia > 0 && (
            <Fila
              etiqueta="Gastos por transferencia (no afectan el efectivo)"
              valor={formatearPrecio(resumen.gastosTransferencia)}
            />
          )}
        </dl>

        {cierre ? (
          <div className="pn-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl leading-none">Caja cerrada</h2>
              <span className="pn-tag" data-estado="entregado">
                Cerrada
              </span>
            </div>
            <p className="pn-muted mt-2 text-sm font-semibold">
              Por {cierre.usuario} el {formatearFechaHora(cierre.creadoEn)}
            </p>
            <dl className="pn-rows mt-3 tabular-nums">
              <Fila etiqueta="Efectivo esperado" valor={formatearPrecio(cierre.efectivoEsperado)} />
              <Fila etiqueta="Efectivo contado" valor={formatearPrecio(cierre.efectivoContado)} />
              <Fila
                etiqueta="Diferencia"
                valor={`${cierre.diferencia > 0 ? '+' : ''}${formatearPrecio(cierre.diferencia)}`}
                destacado
              />
            </dl>
          </div>
        ) : diaEsFuturo ? (
          <p className="pn-alert">No se puede cerrar la caja de un día que todavía no empezó.</p>
        ) : (
          <FormularioCierre
            dia={dia}
            ventasEfectivo={resumen.ventasEfectivo}
            gastosEfectivo={resumen.gastosEfectivo}
            cierraComo={usuario.nombre}
          />
        )}

        <div>
          <h2 className="mb-3 text-2xl leading-none">Cierres anteriores</h2>
          {cierres.length === 0 ? (
            <p className="pn-muted text-sm font-semibold">Todavía no se cerró ninguna caja.</p>
          ) : (
            <div className="pn-card overflow-x-auto">
              <table className="pn-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th className="text-right">Esperado</th>
                    <th className="text-right">Contado</th>
                    <th className="text-right">Diferencia</th>
                    <th>Cerró</th>
                  </tr>
                </thead>
                <tbody>
                  {cierres.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/caja?dia=${c.fecha}`} className="pn-link">
                          {mostrarDia(c.fecha)}
                        </Link>
                      </td>
                      <td className="text-right">{formatearPrecio(c.efectivoEsperado)}</td>
                      <td className="text-right">{formatearPrecio(c.efectivoContado)}</td>
                      {/* El faltante va en rojo; el signo ya lo dice sin depender del color */}
                      <td className={`text-right font-extrabold ${c.diferencia < 0 ? 'text-pancho-red-deep' : ''}`}>
                        {c.diferencia > 0 ? '+' : ''}
                        {formatearPrecio(c.diferencia)}
                      </td>
                      <td>
                        {c.usuario}
                        <span className="pn-muted"> · {formatearFechaHora(c.creadoEn)}</span>
                      </td>
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

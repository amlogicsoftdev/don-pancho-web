import Link from 'next/link'
import { requerirUsuario } from '@/lib/auth/guards'
import { diaOperativo, esDiaValido, leerCorteHora, mostrarDia, sumarDias } from '@/lib/caja/dia'
import { buscarCierre, listarCierres, resumenDia } from '@/lib/caja/queries'
import { formatearFechaHora, formatearPrecio } from '@/lib/orders/estados'
import { FormularioCierre } from './formulario-cierre'

const Fila = ({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) => (
  <div className={`flex justify-between gap-3 py-1.5 ${destacado ? 'font-display text-xl' : 'text-sm'}`}>
    <dt className={destacado ? '' : 'text-pancho-muted'}>{etiqueta}</dt>
    <dd className={destacado ? 'text-pancho-orange' : ''}>{valor}</dd>
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
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Cierre de caja</h1>
        <nav className="flex items-center gap-2 text-sm" aria-label="Cambiar de día">
          <Link href={`/admin/caja?dia=${sumarDias(dia, -1)}`} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/5">
            ← Anterior
          </Link>
          <span className="px-2 font-semibold">{mostrarDia(dia)}</span>
          {dia < hoy ? (
            <Link href={`/admin/caja?dia=${sumarDias(dia, 1)}`} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/5">
              Siguiente →
            </Link>
          ) : (
            <span className="rounded-lg border border-white/5 px-3 py-1.5 text-pancho-muted">Hoy</span>
          )}
        </nav>
      </header>

      {resumen.sinEntregar > 0 && (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
          Hay {resumen.sinEntregar} {resumen.sinEntregar === 1 ? 'pedido' : 'pedidos'} de este día sin entregar. El efectivo
          recién se cobra al entregarlos: conviene cerrar la caja cuando estén todos resueltos.
        </p>
      )}

      <dl className="rounded-xl border border-white/10 bg-pancho-surface p-4">
        <Fila etiqueta={`Ventas del día (${resumen.cantidadVentas})`} valor={formatearPrecio(resumen.ventasEfectivo + resumen.transferenciasConfirmadas)} destacado />
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
          <Fila etiqueta="Gastos por transferencia (no afectan el efectivo)" valor={formatearPrecio(resumen.gastosTransferencia)} />
        )}
      </dl>

      {cierre ? (
        <div className="space-y-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <h2 className="text-lg text-emerald-200">Caja cerrada</h2>
          <p className="text-sm text-pancho-muted">
            Por {cierre.usuario} el {formatearFechaHora(cierre.creadoEn)}
          </p>
          <dl>
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
        <p className="text-sm text-pancho-muted">No se puede cerrar la caja de un día que todavía no empezó.</p>
      ) : (
        <FormularioCierre
          dia={dia}
          ventasEfectivo={resumen.ventasEfectivo}
          gastosEfectivo={resumen.gastosEfectivo}
          cierraComo={usuario.nombre}
        />
      )}

      <div>
        <h2 className="mb-2 text-lg">Cierres anteriores</h2>
        {cierres.length === 0 ? (
          <p className="text-sm text-pancho-muted">Todavía no se cerró ninguna caja.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-pancho-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-pancho-muted">
                <tr>
                  <th className="p-3">Día</th>
                  <th className="p-3 text-right">Esperado</th>
                  <th className="p-3 text-right">Contado</th>
                  <th className="p-3 text-right">Diferencia</th>
                  <th className="p-3">Cerró</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {cierres.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3">
                      <Link href={`/admin/caja?dia=${c.fecha}`} className="text-pancho-orange hover:underline">
                        {mostrarDia(c.fecha)}
                      </Link>
                    </td>
                    <td className="p-3 text-right">{formatearPrecio(c.efectivoEsperado)}</td>
                    <td className="p-3 text-right">{formatearPrecio(c.efectivoContado)}</td>
                    <td className={`p-3 text-right font-semibold ${c.diferencia === 0 ? '' : c.diferencia > 0 ? 'text-sky-300' : 'text-rose-300'}`}>
                      {c.diferencia > 0 ? '+' : ''}
                      {formatearPrecio(c.diferencia)}
                    </td>
                    <td className="p-3">
                      {c.usuario}
                      <span className="text-pancho-muted"> · {formatearFechaHora(c.creadoEn)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}


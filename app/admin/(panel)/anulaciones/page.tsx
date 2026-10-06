import { requerirDueno } from '@/lib/auth/guards'
import { listarAnulaciones } from '@/lib/caja/queries'
import { formatearHora, formatearNumero, formatearSoloFecha } from '@/lib/orders/estados'

export default async function AnulacionesPage() {
  await requerirDueno()
  const anulaciones = await listarAnulaciones()

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-3xl">Cancelados y borrados</h1>
      <p className="mb-4 text-sm text-pancho-muted">
        Registro de todos los pedidos cancelados o borrados, con el motivo y quién lo hizo.
      </p>

      {anulaciones.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-pancho-surface p-6 text-center text-pancho-muted">
          Todavía no hay pedidos cancelados ni borrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-pancho-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-pancho-muted">
              <tr>
                <th className="p-3">N°</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Hora</th>
                <th className="p-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {anulaciones.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 font-semibold">{formatearNumero(a.numeroPedido)}</td>
                  <td className="p-3">{a.accion === 'cancelado' ? 'Cancelado' : 'Borrado'}</td>
                  <td className="p-3">{a.motivo}</td>
                  <td className="p-3">{formatearSoloFecha(a.creadoEn)}</td>
                  <td className="p-3">{formatearHora(a.creadoEn)}</td>
                  <td className="p-3">{a.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

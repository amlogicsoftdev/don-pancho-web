import { requerirDueno } from '@/lib/auth/guards'
import { listarAnulaciones } from '@/lib/caja/queries'
import { formatearHora, formatearNumero, formatearSoloFecha } from '@/lib/orders/estados'
import { Encabezado } from '../encabezado'

export default async function AnulacionesPage() {
  await requerirDueno()
  const anulaciones = await listarAnulaciones()

  return (
    <section className="mx-auto max-w-4xl">
      <Encabezado
        titulo="Cancelados y borrados"
        descripcion="Registro de todos los pedidos cancelados o borrados, con el motivo y quién lo hizo."
      />

      {anulaciones.length === 0 ? (
        <p className="pn-card pn-muted mt-6 p-8 text-center font-semibold">Todavía no hay pedidos cancelados ni borrados.</p>
      ) : (
        <div className="pn-card mt-6 overflow-x-auto">
          <table className="pn-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Acción</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {anulaciones.map((a) => (
                <tr key={a.id}>
                  <td className="font-heading text-xl leading-none text-pancho-red-deep">{formatearNumero(a.numeroPedido)}</td>
                  <td>
                    <span className="pn-tag">{a.accion === 'cancelado' ? 'Cancelado' : 'Borrado'}</span>
                  </td>
                  <td className="font-bold">{a.motivo}</td>
                  <td>{formatearSoloFecha(a.creadoEn)}</td>
                  <td>{formatearHora(a.creadoEn)}</td>
                  <td>{a.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

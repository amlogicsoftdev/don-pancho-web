import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ETIQUETA_ESTADO,
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  etiquetaAvance,
  formatearFechaHora,
  formatearNumero,
  formatearPrecio,
  sePuedeCancelar,
} from '@/lib/orders/estados'
import { leerNombreLocal, obtenerPedido } from '@/lib/orders/queries'
import { linkWhatsApp, mensajeConfirmacion } from '@/lib/whatsapp'
import { InsigniaEstado } from '../insignia-estado'
import { AccionesPedido } from './acciones-pedido'

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario()
  const { id: idCrudo } = await params
  const id = Number(idCrudo)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const datos = await obtenerPedido(id)
  if (!datos) notFound()
  const { pedido, items, historial, cancelacion } = datos

  const nombreLocal = await leerNombreLocal()
  const enlaceWhatsApp = linkWhatsApp(
    pedido.clienteTelefono,
    mensajeConfirmacion(
      {
        numero: pedido.numero,
        clienteNombre: pedido.clienteNombre,
        modalidad: pedido.modalidad,
        metodoPago: pedido.metodoPago,
        direccion: pedido.direccion,
        total: pedido.total,
        items,
      },
      nombreLocal,
    ),
  )

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/pedidos" className="text-sm text-cheesy-muted hover:text-cheesy-cream">
        ← Volver a pedidos
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">Pedido N° {formatearNumero(pedido.numero)}</h1>
        <InsigniaEstado estado={pedido.estado} />
        <span className="text-sm text-cheesy-muted">{formatearFechaHora(pedido.creadoEn)}</span>
      </header>

      {cancelacion && (
        <p className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-200">
          Cancelado por {cancelacion.usuario} el {formatearFechaHora(cancelacion.creadoEn)}. Motivo: {cancelacion.motivo}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
          <h2 className="mb-2 text-lg">Cliente</h2>
          <p className="font-semibold">{pedido.clienteNombre}</p>
          <p className="text-sm text-cheesy-muted">Tel. {pedido.clienteTelefono}</p>
          <p className="mt-2 text-sm">{ETIQUETA_MODALIDAD[pedido.modalidad]}</p>
          {pedido.direccion && <p className="text-sm">📍 {pedido.direccion}</p>}
          {pedido.referencia && <p className="text-sm text-cheesy-muted">Ref.: {pedido.referencia}</p>}
          {pedido.notas && <p className="mt-2 text-sm">📝 {pedido.notas}</p>}
        </div>

        <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
          <h2 className="mb-2 text-lg">Pago</h2>
          <p className="font-semibold">{ETIQUETA_PAGO[pedido.metodoPago]}</p>
          {pedido.metodoPago === 'transferencia' && (
            <p className={`text-sm ${pedido.pagoConfirmado ? 'text-emerald-300' : 'text-amber-300'}`}>
              {pedido.pagoConfirmado ? 'Pago confirmado' : 'Pago sin confirmar'}
            </p>
          )}
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-cheesy-muted">Subtotal</dt>
              <dd>{formatearPrecio(pedido.subtotal)}</dd>
            </div>
            {pedido.descuentoMonto > 0 && (
              <div className="flex justify-between">
                <dt className="text-cheesy-muted">Descuento ({pedido.descuentoPorcentaje}%)</dt>
                <dd>-{formatearPrecio(pedido.descuentoMonto)}</dd>
              </div>
            )}
            <div className="flex justify-between font-display text-xl">
              <dt>Total</dt>
              <dd className="text-cheesy-yellow">{formatearPrecio(pedido.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
        <h2 className="mb-2 text-lg">Productos</h2>
        <ul className="divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2">
              <div>
                <p>
                  <span className="font-bold">{item.cantidad}x</span> {item.nombre}
                </p>
                {item.aclaraciones && <p className="text-sm text-cheesy-muted">{item.aclaraciones}</p>}
              </div>
              <span>{formatearPrecio(item.precioUnitario * item.cantidad)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
        <h2 className="mb-3 text-lg">Acciones</h2>
        <AccionesPedido
          pedidoId={pedido.id}
          etiquetaAvance={etiquetaAvance(pedido.estado, pedido.modalidad)}
          sePuedeCancelar={sePuedeCancelar(pedido.estado)}
          linkWhatsApp={pedido.estado === 'cancelado' ? null : enlaceWhatsApp}
          esTransferencia={pedido.metodoPago === 'transferencia'}
          pagoConfirmado={pedido.pagoConfirmado}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-cheesy-surface p-4">
        <h2 className="mb-2 text-lg">Historial</h2>
        <ol className="space-y-1 text-sm">
          {historial.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-2">
              <span>
                {h.estadoAnterior ? `${ETIQUETA_ESTADO[h.estadoAnterior]} → ` : ''}
                <strong>{ETIQUETA_ESTADO[h.estadoNuevo]}</strong>
                <span className="text-cheesy-muted"> · {h.usuario ?? 'Sistema (pedido web)'}</span>
              </span>
              <span className="text-cheesy-muted">{formatearFechaHora(h.creadoEn)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

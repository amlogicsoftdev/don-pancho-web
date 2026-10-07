import { ArrowLeft, Clock, MapPin, StickyNote } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconoWhatsApp } from '@/components/icono-whatsapp'
import { buttonVariants } from '@/components/ui/button'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ESTADOS_ACTIVOS,
  ETIQUETA_ESTADO,
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  etiquetaAvance,
  etiquetaTiempo,
  formatearFechaHora,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  pasosDelPedido,
  sePuedeCancelar,
} from '@/lib/orders/estados'
import { linkConfirmacion } from '@/lib/orders/mensajes'
import { obtenerPedido } from '@/lib/orders/queries'
import { InsigniaEstado } from '../insignia-estado'
import {
  AccionesEstado,
  AnularPedido,
  BotonImprimirComandas,
  DescuentoPedido,
  PagoConfirmado,
  PasosPedido,
} from './acciones-pedido'

/**
 * Detalle de un pedido. Cada acción vive al lado de lo que cambia, en vez de estar todas juntas:
 * - avanzar el estado, debajo de los pasos del pedido (es el botón principal);
 * - imprimir las comandas, en la hoja de los productos;
 * - confirmar por WhatsApp, en la hoja del cliente;
 * - marcar que llegó la transferencia, en la hoja del pago;
 * - cancelar o borrar, aparte y con menos peso, al final.
 */
export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario()
  const { id: idCrudo } = await params
  const id = Number(idCrudo)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const datos = await obtenerPedido(id)
  if (!datos) notFound()
  const { pedido, items, historial, cancelacion, descuentoAplicadoPor } = datos

  const esMostrador = pedido.origen === 'mostrador'
  const cancelado = pedido.estado === 'cancelado'
  // Reenviar la confirmación: solo de un pedido ya confirmado (el pendiente se confirma con el cuadro)
  const enlaceWhatsApp = !cancelado && pedido.estado !== 'pendiente' ? await linkConfirmacion(pedido) : null
  const esTransferencia = pedido.metodoPago === 'transferencia'
  const avance = etiquetaAvance(pedido.estado, pedido.modalidad)
  // El descuento se puede cambiar mientras el pedido está en curso y no se confirmó el pago
  const sePuedeDescontar = ESTADOS_ACTIVOS.includes(pedido.estado) && !pedido.pagoConfirmado

  const cantidadProductos = items.reduce((suma, item) => suma + item.cantidad, 0)

  return (
    <section className="mx-auto max-w-5xl">
      <Link href="/admin/pedidos" className="pn-back">
        <ArrowLeft className="size-4" />
        Volver a pedidos
      </Link>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b-2 border-pancho-black pb-4">
        <div>
          <p className="pn-eyebrow mb-1.5">
            {esMostrador ? 'Venta de mostrador' : 'Pedido web'} · {formatearFechaHora(pedido.creadoEn)}
          </p>
          <h1 className="text-5xl leading-none sm:text-6xl">
            Pedido <span className="text-pancho-red-deep">N° {formatearNumero(pedido.numero)}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pn-tag pn-tag--lg">{ETIQUETA_MODALIDAD[pedido.modalidad]}</span>
          <InsigniaEstado estado={pedido.estado} grande />
        </div>
      </header>

      {cancelacion && (
        <p className="pn-alert pn-alert--error mt-6">
          Cancelado por {cancelacion.usuario} el {formatearFechaHora(cancelacion.creadoEn)}. Motivo: {cancelacion.motivo}
        </p>
      )}

      {/* En escritorio son dos columnas. En celular las columnas se deshacen (contents) y las
          hojas van una debajo de la otra en el orden en que se usan: estado, productos,
          cliente, pago, historial y, al final, anular. */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="contents lg:block lg:space-y-6">
          {/* ---------- Estado: los pasos y, debajo, el botón que avanza ---------- */}
          <div className="pn-card order-1 p-5 sm:p-6 lg:order-none">
            <h2 className="text-2xl leading-none">Estado del pedido</h2>

            <PasosPedido
              pedidoId={pedido.id}
              pasos={pasosDelPedido(pedido.modalidad)}
              estadoActual={pedido.estado}
              cancelado={cancelado}
            />

            {pedido.tiempoEstimadoMin && pedido.entregaEstimada && !cancelado && (
              <p className="mt-5 flex items-center gap-2 text-sm font-bold">
                <Clock className="size-4" aria-hidden="true" />
                Tiempo informado: {etiquetaTiempo(pedido.tiempoEstimadoMin)} · {pedido.modalidad === 'delivery' ? 'llega' : 'listo'}{' '}
                aprox. a las {formatearHora(pedido.entregaEstimada)}
              </p>
            )}

            <div className="mt-6 border-t-2 border-dotted border-pancho-black/25 pt-5">
              <AccionesEstado
                pedidoId={pedido.id}
                numero={pedido.numero}
                estado={pedido.estado}
                etiquetaAvance={avance}
              />
              {!avance && pedido.estado !== 'pendiente' && (
                <p className="pn-muted text-sm font-semibold">
                  {cancelado ? 'El pedido está cancelado: no quedan pasos.' : 'El pedido ya está entregado: no quedan pasos.'}
                </p>
              )}
            </div>
          </div>

          {/* ---------- Productos, con las comandas a mano ---------- */}
          <div className="pn-card order-2 p-5 sm:p-6 lg:order-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl leading-none">
                Productos <span className="pn-muted">({cantidadProductos})</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/admin/pedidos/${pedido.id}/comandas`} className="pn-link text-sm font-semibold">
                  Ver comandas
                </Link>
                <BotonImprimirComandas pedidoId={pedido.id} />
              </div>
            </div>

            <ul className="pn-rows mt-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-4 py-3">
                  <span className="grid size-9 flex-none place-items-center bg-pancho-black font-heading text-lg leading-none text-white">
                    {item.cantidad}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base leading-snug font-bold">{item.nombre}</p>
                    {item.aclaraciones && <p className="pn-muted text-sm font-medium">{item.aclaraciones}</p>}
                  </div>
                  <span className="pt-0.5 text-base font-bold tabular-nums">
                    {formatearPrecio(item.precioUnitario * item.cantidad)}
                  </span>
                </li>
              ))}
            </ul>

            {pedido.notas && (
              <p className="pn-alert pn-alert--warn mt-4 flex items-start gap-2.5">
                <StickyNote className="mt-0.5 size-4 flex-none" aria-hidden="true" />
                <span>
                  <span className="pn-eyebrow block">Nota del cliente</span>
                  {pedido.notas}
                </span>
              </p>
            )}
          </div>

          {/* ---------- Historial ---------- */}
          <div className="pn-card order-5 p-5 sm:p-6 lg:order-none">
            <h2 className="text-2xl leading-none">Historial</h2>
            <ol className="pn-timeline mt-5">
              {historial.map((h) => (
                <li key={h.id}>
                  <p className="text-sm leading-snug font-semibold">
                    {h.estadoAnterior ? `${ETIQUETA_ESTADO[h.estadoAnterior]} → ` : ''}
                    <strong className="font-extrabold">{ETIQUETA_ESTADO[h.estadoNuevo]}</strong>
                  </p>
                  <p className="pn-muted text-xs font-medium">
                    {h.usuario ?? 'Sistema (pedido web)'} · {formatearFechaHora(h.creadoEn)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="contents lg:block lg:space-y-6">
          {/* ---------- Cliente, con el aviso por WhatsApp ---------- */}
          <div className="pn-card order-3 p-5 lg:order-none">
            <h2 className="text-2xl leading-none">Cliente</h2>
            <p className="mt-4 text-lg leading-tight font-bold">{pedido.clienteNombre}</p>
            {pedido.clienteTelefono && <p className="pn-muted text-sm font-semibold">Tel. {pedido.clienteTelefono}</p>}

            {pedido.direccion && (
              <p className="mt-4 flex items-start gap-2 text-sm font-semibold">
                <MapPin className="mt-0.5 size-4 flex-none" aria-hidden="true" />
                <span>
                  {pedido.direccion}
                  {pedido.referencia && <span className="pn-muted block font-medium">Ref.: {pedido.referencia}</span>}
                </span>
              </p>
            )}

            {enlaceWhatsApp && (
              <div className="mt-5 border-t-2 border-dotted border-pancho-black/25 pt-5">
                <a
                  href={enlaceWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  <IconoWhatsApp className="size-4" />
                  Reenviar por WhatsApp
                </a>
                <p className="pn-muted mt-2 text-xs font-medium">
                  Vuelve a abrir WhatsApp con el mensaje de confirmación ya escrito, con el tiempo informado.
                </p>
              </div>
            )}
          </div>

          {/* ---------- Pago, con la confirmación de la transferencia ---------- */}
          <div className="pn-card order-4 p-5 lg:order-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl leading-none">Pago</h2>
              <span className="pn-tag">{ETIQUETA_PAGO[pedido.metodoPago]}</span>
            </div>

            <dl className="mt-4 space-y-1.5 text-sm font-semibold tabular-nums">
              <div className="flex justify-between gap-3">
                <dt className="pn-muted">Subtotal</dt>
                <dd>{formatearPrecio(pedido.subtotal)}</dd>
              </div>
              {pedido.descuentoMonto > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="pn-muted">
                    Descuento ({pedido.descuentoPorcentaje}%)
                    {descuentoAplicadoPor && pedido.descuentoAplicadoEn && (
                      <span className="block text-xs font-medium">
                        {descuentoAplicadoPor} · {formatearFechaHora(pedido.descuentoAplicadoEn)}
                      </span>
                    )}
                  </dt>
                  <dd>-{formatearPrecio(pedido.descuentoMonto)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 border-t-2 border-pancho-black pt-3">
                <dt className="font-display text-2xl leading-none">Total</dt>
                <dd className="font-display text-4xl leading-none">{formatearPrecio(pedido.total)}</dd>
              </div>
            </dl>

            {sePuedeDescontar && (
              <div className="mt-5 border-t-2 border-dotted border-pancho-black/25 pt-5">
                <DescuentoPedido pedidoId={pedido.id} porcentaje={pedido.descuentoPorcentaje} />
                <p className="pn-muted mt-2 text-xs font-medium">
                  Aplicalo antes de confirmar por WhatsApp, así el mensaje sale con el total correcto.
                </p>
              </div>
            )}

            {esTransferencia && (
              <div className="mt-5 border-t-2 border-dotted border-pancho-black/25 pt-5">
                <p className={`pn-alert mb-4 ${pedido.pagoConfirmado ? 'pn-alert--ok' : 'pn-alert--warn'}`}>
                  {pedido.pagoConfirmado ? 'Pago confirmado.' : 'Pago sin confirmar.'}
                </p>
                <PagoConfirmado pedidoId={pedido.id} confirmado={pedido.pagoConfirmado} />
              </div>
            )}

            {/* Efectivo: se cobra al entregar (o en el mostrador, al registrar la venta) */}
            {!esTransferencia && !cancelado && (
              <p
                className={`pn-alert mt-5 ${pedido.pagoConfirmado || pedido.estado === 'entregado' ? 'pn-alert--ok' : 'pn-alert--warn'}`}
              >
                {pedido.pagoConfirmado || pedido.estado === 'entregado'
                  ? 'Efectivo cobrado.'
                  : 'Efectivo a cobrar al entregar: suma a la caja cuando el pedido pase a «Entregado».'}
              </p>
            )}
          </div>

          {/* ---------- Cancelar o borrar: aparte y con menos peso ---------- */}
          <div className="pn-card pn-card--soft order-6 p-5 lg:order-none">
            <h2 className="mb-4 text-xl leading-none">Anular</h2>
            <AnularPedido pedidoId={pedido.id} sePuedeCancelar={sePuedeCancelar(pedido.estado)} />
          </div>
        </aside>
      </div>
    </section>
  )
}

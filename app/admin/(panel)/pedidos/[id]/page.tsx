import { ArrowLeft, Check, MapPin, Printer, StickyNote } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconoWhatsApp } from '@/components/icono-whatsapp'
import { buttonVariants } from '@/components/ui/button'
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
  type EstadoPedido,
} from '@/lib/orders/estados'
import { leerNombreLocal, obtenerPedido } from '@/lib/orders/queries'
import { linkWhatsApp, mensajeConfirmacion } from '@/lib/whatsapp'
import { urlDelSitio } from '@/lib/url-sitio'
import { leerDatosTransferencia } from '@/lib/pagos/transferencia'
import { InsigniaEstado } from '../insignia-estado'
import { AnularPedido, BotonAvanzar, PagoConfirmado } from './acciones-pedido'

// Camino que recorre un pedido. El de retiro no pasa por «En camino».
const PASOS_DELIVERY: EstadoPedido[] = ['pendiente', 'en_preparacion', 'en_camino', 'entregado']
const PASOS_RETIRO: EstadoPedido[] = ['pendiente', 'en_preparacion', 'entregado']

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
  const { pedido, items, historial, cancelacion } = datos

  const [nombreLocal, sitio, datosTransferencia] = await Promise.all([
    leerNombreLocal(),
    urlDelSitio(),
    pedido.metodoPago === 'transferencia' ? leerDatosTransferencia() : null,
  ])
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
        linkSeguimiento: `${sitio}/pedido/${pedido.tokenSeguimiento}`,
        datosTransferencia,
      },
      nombreLocal,
    ),
  )

  const esMostrador = pedido.origen === 'mostrador'
  const cancelado = pedido.estado === 'cancelado'
  const mostrarWhatsApp = !cancelado && !esMostrador
  const esTransferencia = pedido.metodoPago === 'transferencia'
  const avance = etiquetaAvance(pedido.estado, pedido.modalidad)

  const pasos = pedido.modalidad === 'delivery' ? PASOS_DELIVERY : PASOS_RETIRO
  const pasoActual = pasos.indexOf(pedido.estado)
  const estadoDelPaso = (indice: number) => {
    if (cancelado || indice > pasoActual) return 'pendiente'
    // El último paso (entregado) no queda «en curso»: ya está hecho
    return indice < pasoActual || indice === pasos.length - 1 ? 'hecho' : 'actual'
  }

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

            <ol className="pn-steps mt-6" aria-label="Pasos del pedido">
              {pasos.map((paso, indice) => {
                const estadoPaso = estadoDelPaso(indice)
                return (
                  <li
                    key={paso}
                    className="pn-step"
                    data-paso={estadoPaso}
                    aria-current={estadoPaso === 'actual' ? 'step' : undefined}
                  >
                    <span className="pn-step__num" aria-hidden="true">
                      {estadoPaso === 'hecho' ? <Check className="size-5" strokeWidth={3} /> : indice + 1}
                    </span>
                    <span className="pn-step__name">
                      {ETIQUETA_ESTADO[paso]}
                      {estadoPaso === 'hecho' && <span className="sr-only"> (hecho)</span>}
                    </span>
                  </li>
                )
              })}
            </ol>

            <div className="mt-6 border-t-2 border-dotted border-pancho-black/25 pt-5">
              {avance ? (
                <>
                  <p className="pn-eyebrow mb-3">Siguiente paso</p>
                  <BotonAvanzar pedidoId={pedido.id} etiqueta={avance} />
                </>
              ) : (
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
              <Link
                href={`/admin/pedidos/${pedido.id}/comandas`}
                target="_blank"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <Printer />
                Imprimir comandas
              </Link>
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

            {mostrarWhatsApp && (
              <div className="mt-5 border-t-2 border-dotted border-pancho-black/25 pt-5">
                <a
                  href={enlaceWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  <IconoWhatsApp className="size-4" />
                  Confirmar por WhatsApp
                </a>
                <p className="pn-muted mt-2 text-xs font-medium">Abre WhatsApp con el mensaje de confirmación ya escrito.</p>
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
                  <dt className="pn-muted">Descuento ({pedido.descuentoPorcentaje}%)</dt>
                  <dd>-{formatearPrecio(pedido.descuentoMonto)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 border-t-2 border-pancho-black pt-3">
                <dt className="font-display text-2xl leading-none">Total</dt>
                <dd className="font-display text-4xl leading-none">{formatearPrecio(pedido.total)}</dd>
              </div>
            </dl>

            {esTransferencia && (
              <div className="mt-5 border-t-2 border-dotted border-pancho-black/25 pt-5">
                <p className={`pn-alert mb-4 ${pedido.pagoConfirmado ? 'pn-alert--ok' : 'pn-alert--warn'}`}>
                  {pedido.pagoConfirmado ? 'Pago confirmado.' : 'Pago sin confirmar.'}
                </p>
                <PagoConfirmado pedidoId={pedido.id} confirmado={pedido.pagoConfirmado} />
              </div>
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

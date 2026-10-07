import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'
import { Logo } from '@/components/logo'
import { PanchoButton } from '@/components/pancho-button'
import { leerDatosLocal } from '@/lib/local/queries'
import {
  ESTADOS_ACTIVOS,
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  formatearFechaHora,
  formatearHora,
  formatearNumero,
  formatearPrecio,
} from '@/lib/orders/estados'
import { obtenerPedidoPorToken, pasosDelPedido, textoParaCliente } from '@/lib/orders/seguimiento'
import { leerDatosTransferencia } from '@/lib/pagos/transferencia'
import { ActualizarPedido } from './actualizar-pedido'
import { CopiarTexto } from './copiar-texto'

const ACTUALIZAR_CADA_SEGUNDOS = 20

export const metadata: Metadata = {
  title: 'Seguimiento de tu pedido | Don Pancho & Burger',
  // El link es privado: que no lo indexen los buscadores ni se filtre al abrir otro sitio
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function SeguimientoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [pedido, local] = await Promise.all([obtenerPedidoPorToken(token), leerDatosLocal()])
  if (!pedido) notFound()

  const enCurso = ESTADOS_ACTIVOS.includes(pedido.estado)
  const cancelado = pedido.estado === 'cancelado'
  const texto = textoParaCliente(pedido.estado, pedido.modalidad)
  const pasos = pasosDelPedido(pedido.modalidad)
  const pasoActual = pasos.indexOf(pedido.estado)
  // Último momento en que el pedido entró a cada estado
  const horaDe = new Map(pedido.historial.map((h) => [h.estado, h.creadoEn]))

  // Datos para transferir: solo mientras el pago no esté confirmado y el pedido siga en curso
  const esTransferencia = pedido.metodoPago === 'transferencia'
  const datosTransferencia =
    esTransferencia && !pedido.pagoConfirmado && enCurso ? await leerDatosTransferencia() : null

  return (
    <main className="flex min-h-dvh flex-col bg-pancho-paper bg-[url('/images/fondo-secciones-crema.webp')] bg-cover bg-top px-4 py-6 text-pancho-black selection:bg-pancho-orange selection:text-pancho-black sm:px-8 lg:h-dvh lg:overflow-hidden lg:py-5">
      <ActualizarPedido activo={enCurso} segundos={ACTUALIZAR_CADA_SEGUNDOS} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 lg:min-h-0 lg:gap-4">
        <header className="flex items-center justify-between gap-4 border-b-2 border-pancho-black pb-3">
          <Logo />
          <span className="inline-block -rotate-2 bg-pancho-red-deep px-3 py-1.5 font-sans text-xs font-extrabold uppercase leading-none tracking-[0.04em] text-white shadow-[3px_3px_0_var(--color-pancho-black)]">
            Pedido N° {formatearNumero(pedido.numero)}
          </span>
        </header>

        <div className="grid flex-1 gap-5 lg:min-h-0 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          {/* Izquierda: estado y pasos */}
          <section aria-live="polite" className="flex flex-col justify-between gap-6 lg:min-h-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-pancho-black/60">
                {formatearFechaHora(pedido.creadoEn)}
                {pedido.nombreCliente && ` · ¡Hola ${pedido.nombreCliente}!`}
              </p>
              <h1
                className={`mt-2 text-6xl leading-[0.9] sm:text-7xl lg:text-8xl ${cancelado ? 'text-pancho-red-deep' : 'text-pancho-black'}`}
              >
                {texto.titulo}
              </h1>
              <p className="mt-3 max-w-md font-medium text-pancho-black/75">{texto.detalle}</p>
              {(pedido.estado === 'en_preparacion' || pedido.estado === 'en_camino') && pedido.entregaEstimada && (
                <p className="mt-4 inline-block -rotate-1 border-2 border-pancho-black bg-pancho-yellow px-3 py-1.5 font-extrabold shadow-[3px_3px_0_var(--color-pancho-black)]">
                  {pedido.modalidad === 'delivery' ? 'Llega' : 'Listo para retirar'} aprox. a las{' '}
                  {formatearHora(pedido.entregaEstimada)}
                </p>
              )}
              {/* Hasta que el local confirma que llegó la transferencia */}
              {esTransferencia && !pedido.pagoConfirmado && !cancelado && (
                <div className="mt-4 max-w-md border-2 border-pancho-red-deep px-4 py-3">
                  <p className="font-extrabold text-pancho-red-deep">Estamos esperando tu transferencia</p>
                  <p className="mt-1 text-sm font-medium text-pancho-black/75">
                    Más abajo tenés los datos para transferir. Mandanos el comprobante por WhatsApp y te lo confirmamos.
                  </p>
                </div>
              )}
            </div>

            {!cancelado && (
              <ol className="flex border-2 border-pancho-black bg-white bg-[url('/images/fondo-papel-blanco.webp')] bg-cover bg-center p-4 shadow-[5px_5px_0_var(--color-pancho-black)]">
                {pasos.map((paso, i) => {
                  const hecho = i < pasoActual || pedido.estado === 'entregado'
                  const actual = i === pasoActual && pedido.estado !== 'entregado'
                  const hora = horaDe.get(paso)
                  return (
                    <li key={paso} className="relative flex flex-1 flex-col items-center text-center">
                      {/* Línea que une los pasos */}
                      {i < pasos.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-1/2 top-4 h-0.5 w-full ${hecho ? 'bg-pancho-red-deep' : 'bg-pancho-black/15'}`}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 ${
                          hecho
                            ? 'border-pancho-black bg-pancho-red-deep text-white'
                            : actual
                              ? 'border-pancho-black bg-pancho-yellow'
                              : 'border-pancho-black/25 bg-transparent'
                        }`}
                      >
                        {hecho ? (
                          <Check className="size-4 stroke-3" />
                        ) : actual ? (
                          <span className="size-2.5 animate-pulse rounded-full bg-pancho-black" />
                        ) : null}
                      </span>
                      <p
                        className={`mt-2 text-xs font-extrabold uppercase leading-tight tracking-[0.04em] sm:text-sm ${hecho || actual ? 'text-pancho-black' : 'text-pancho-black/40'}`}
                      >
                        {textoParaCliente(paso, pedido.modalidad).titulo}
                        {actual && <span className="sr-only"> (estado actual)</span>}
                      </p>
                      <p className="mt-0.5 h-4 text-xs text-pancho-black/60">
                        {hora && (hecho || actual) ? formatearHora(hora) : ''}
                      </p>
                    </li>
                  )
                })}
              </ol>
            )}

            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <PanchoButton href={`https://wa.me/${local.whatsapp}`} target="_blank" rel="noopener noreferrer" variant="ink">
                  Escribinos por WhatsApp
                </PanchoButton>
                <PanchoButton href="/menu" variant="ink">
                  Ver el menú
                </PanchoButton>
              </div>
            </div>
          </section>

          {/* Derecha: transferencia y detalle */}
          <div className="flex flex-col gap-4 lg:min-h-0">
            {esTransferencia && pedido.pagoConfirmado && !cancelado && (
              <p className="flex items-center gap-2 border-2 border-pancho-black bg-pancho-yellow bg-[url('/images/fondo-papel-blanco.webp')] bg-cover bg-center bg-blend-multiply p-3 text-sm font-bold shadow-[4px_4px_0_var(--color-pancho-black)]">
                <Check className="size-4" /> Recibimos tu transferencia.
              </p>
            )}
            {datosTransferencia && (
              <section className="border-2 border-pancho-black bg-pancho-red-deep bg-[url('/images/fondo-footer-bordo.webp')] bg-cover bg-center p-4 text-white shadow-[5px_5px_0_var(--color-pancho-black)]">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.12em]">Datos para transferir</h2>
                <dl className="mt-2 space-y-2 text-sm">
                  {datosTransferencia.alias && (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <dt className="text-white/75">Alias</dt>
                        <dd className="select-all break-all font-extrabold">{datosTransferencia.alias}</dd>
                      </div>
                      <CopiarTexto texto={datosTransferencia.alias} etiqueta="alias" />
                    </div>
                  )}
                  {datosTransferencia.cbu && (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <dt className="text-white/75">CBU</dt>
                        <dd className="select-all break-all font-extrabold">{datosTransferencia.cbu}</dd>
                      </div>
                      <CopiarTexto texto={datosTransferencia.cbu} etiqueta="CBU" />
                    </div>
                  )}
                  {datosTransferencia.titular && (
                    <div>
                      <dt className="text-white/75">Titular</dt>
                      <dd className="font-bold">
                        {datosTransferencia.titular}
                        {datosTransferencia.banco && ` · ${datosTransferencia.banco}`}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between border-t-2 border-white/30 pt-2">
                    <dt className="text-white/75">Monto</dt>
                    <dd className="font-heading text-2xl">{formatearPrecio(pedido.total)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm font-medium">Mandanos el comprobante por WhatsApp.</p>
              </section>
            )}

            {/* Detalle del pedido */}
            <section className="flex flex-col border-2 border-pancho-black bg-white bg-[url('/images/fondo-papel-blanco.webp')] bg-cover bg-center p-4 shadow-[5px_5px_0_var(--color-pancho-black)] lg:min-h-0 lg:flex-1">
              <h2 className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-pancho-black/60">Tu pedido</h2>
              <ul className="divide-y divide-pancho-black/10 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {pedido.items.map((item, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                    <div>
                      <p className="font-bold">
                        {item.cantidad}x {item.nombre}
                      </p>
                      {item.aclaraciones && <p className="text-sm text-pancho-black/60">{item.aclaraciones}</p>}
                    </div>
                    <span className="shrink-0 font-medium">{formatearPrecio(item.precioUnitario * item.cantidad)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-2 space-y-1 border-t-2 border-pancho-black pt-3 text-sm">
                {pedido.descuentoMonto > 0 && (
                  <>
                    <div className="flex justify-between text-pancho-black/70">
                      <dt>Subtotal</dt>
                      <dd>{formatearPrecio(pedido.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-pancho-black/70">
                      <dt>Descuento</dt>
                      <dd>-{formatearPrecio(pedido.descuentoMonto)}</dd>
                    </div>
                  </>
                )}
                <div className="flex items-baseline justify-between">
                  <dt className="font-bold uppercase">Total</dt>
                  <dd className="font-heading text-4xl leading-none text-pancho-red-deep">{formatearPrecio(pedido.total)}</dd>
                </div>
                <div className="flex justify-between text-pancho-black/70">
                  <dt>Entrega</dt>
                  <dd>{ETIQUETA_MODALIDAD[pedido.modalidad]}</dd>
                </div>
                <div className="flex justify-between text-pancho-black/70">
                  <dt>Pago</dt>
                  <dd>
                    {ETIQUETA_PAGO[pedido.metodoPago]}
                    {pedido.metodoPago === 'efectivo' && ' (se paga al recibir)'}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

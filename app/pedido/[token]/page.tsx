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
    <main className="min-h-screen bg-pancho-black px-4 py-10 text-pancho-cream">
      <ActualizarPedido activo={enCurso} segundos={ACTUALIZAR_CADA_SEGUNDOS} />

      <div className="mx-auto max-w-xl space-y-8">
        <header className="flex justify-center">
          <Logo />
        </header>

        {/* Estado actual */}
        <section aria-live="polite" className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
            Pedido N° {formatearNumero(pedido.numero)} · {formatearFechaHora(pedido.creadoEn)}
          </p>
          {pedido.nombreCliente && <p className="mt-4 text-neutral-300">¡Hola {pedido.nombreCliente}!</p>}
          <h1 className={`mt-1 text-6xl ${cancelado ? 'text-pancho-red' : 'text-white'}`}>{texto.titulo}</h1>
          <p className="mt-3 text-neutral-300">{texto.detalle}</p>
        </section>

        {/* Pasos del pedido */}
        {!cancelado && (
          <ol className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            {pasos.map((paso, i) => {
              const hecho = i < pasoActual || pedido.estado === 'entregado'
              const actual = i === pasoActual && pedido.estado !== 'entregado'
              const hora = horaDe.get(paso)
              return (
                <li key={paso} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Línea que une los pasos */}
                  {i < pasos.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${hecho ? 'bg-pancho-orange' : 'bg-neutral-800'}`}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      hecho
                        ? 'border-pancho-orange bg-pancho-orange text-pancho-black'
                        : actual
                          ? 'border-pancho-orange bg-pancho-black'
                          : 'border-neutral-700 bg-pancho-black'
                    }`}
                  >
                    {hecho ? (
                      <Check className="size-4 stroke-3" />
                    ) : actual ? (
                      <span className="size-2.5 animate-pulse rounded-full bg-pancho-orange" />
                    ) : null}
                  </span>
                  <div className="pt-1">
                    <p className={`font-bold ${hecho || actual ? 'text-white' : 'text-neutral-500'}`}>
                      {textoParaCliente(paso, pedido.modalidad).titulo}
                      {actual && <span className="sr-only"> (estado actual)</span>}
                    </p>
                    {hora && (hecho || actual) && (
                      <p className="text-sm text-neutral-400">{formatearHora(hora)}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {/* Pago por transferencia */}
        {esTransferencia && pedido.pagoConfirmado && !cancelado && (
          <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <Check className="size-4" /> Recibimos tu transferencia.
          </p>
        )}
        {datosTransferencia && (
          <section className="rounded-2xl border border-pancho-orange/40 bg-pancho-orange/10 p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-pancho-orange">Datos para transferir</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {datosTransferencia.alias && (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <dt className="text-neutral-400">Alias</dt>
                    <dd className="select-all break-all font-bold text-white">{datosTransferencia.alias}</dd>
                  </div>
                  <CopiarTexto texto={datosTransferencia.alias} etiqueta="alias" />
                </div>
              )}
              {datosTransferencia.cbu && (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <dt className="text-neutral-400">CBU</dt>
                    <dd className="select-all break-all font-bold text-white">{datosTransferencia.cbu}</dd>
                  </div>
                  <CopiarTexto texto={datosTransferencia.cbu} etiqueta="CBU" />
                </div>
              )}
              {datosTransferencia.titular && (
                <div>
                  <dt className="text-neutral-400">Titular</dt>
                  <dd className="text-white">
                    {datosTransferencia.titular}
                    {datosTransferencia.banco && ` · ${datosTransferencia.banco}`}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-neutral-400">Monto</dt>
                <dd className="font-bold text-white">{formatearPrecio(pedido.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-neutral-300">Mandanos el comprobante por WhatsApp.</p>
          </section>
        )}

        {/* Detalle del pedido */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Tu pedido</h2>
          <ul className="divide-y divide-neutral-800/70">
            {pedido.items.map((item, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 py-2.5">
                <div>
                  <p className="text-white">
                    {item.cantidad}x {item.nombre}
                  </p>
                  {item.aclaraciones && <p className="text-sm text-neutral-400">{item.aclaraciones}</p>}
                </div>
                <span className="shrink-0 text-neutral-300">{formatearPrecio(item.precioUnitario * item.cantidad)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-1.5 border-t border-neutral-800 pt-3 text-sm">
            {pedido.descuentoMonto > 0 && (
              <>
                <div className="flex justify-between text-neutral-400">
                  <dt>Subtotal</dt>
                  <dd>{formatearPrecio(pedido.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <dt>Descuento</dt>
                  <dd>-{formatearPrecio(pedido.descuentoMonto)}</dd>
                </div>
              </>
            )}
            <div className="flex items-baseline justify-between">
              <dt className="text-neutral-400">Total</dt>
              <dd className="font-heading text-3xl text-pancho-orange">{formatearPrecio(pedido.total)}</dd>
            </div>
            <div className="flex justify-between text-neutral-400">
              <dt>Entrega</dt>
              <dd>{ETIQUETA_MODALIDAD[pedido.modalidad]}</dd>
            </div>
            <div className="flex justify-between text-neutral-400">
              <dt>Pago</dt>
              <dd>
                {ETIQUETA_PAGO[pedido.metodoPago]}
                {pedido.metodoPago === 'efectivo' && ' (se paga al recibir)'}
              </dd>
            </div>
          </dl>
        </section>

        <footer className="space-y-4 text-center">
          {enCurso && (
            <p className="text-xs text-neutral-500">
              Esta página se actualiza sola cada {ACTUALIZAR_CADA_SEGUNDOS} segundos.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <PanchoButton href={`https://wa.me/${local.whatsapp}`} target="_blank" rel="noopener noreferrer" variant="orange">
              Escribinos por WhatsApp
            </PanchoButton>
            <PanchoButton href="/menu" variant="orange">
              Ver el menú
            </PanchoButton>
          </div>
        </footer>
      </div>
    </main>
  )
}

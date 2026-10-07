'use client'

import { Check, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { IconoWhatsApp } from '@/components/icono-whatsapp'
import {
  aplicarDescuentos,
  avanzarPedido,
  borrarPedido,
  cambiarEstado,
  cancelarPedido,
  confirmarPago,
  confirmarPedido,
  rechazarPedido,
  type ResultadoAccion,
} from '@/lib/orders/actions'
import { ETIQUETA_ESTADO, MOTIVOS_RECHAZO, type EstadoPedido } from '@/lib/orders/estados'
import { CuadroConfirmar } from '../cuadro-confirmar'
import { imprimirComandas } from '../imprimir-comandas'

// Las acciones del pedido van repartidas por la pantalla, cada una al lado de lo que cambia:
// - <PasosPedido>     los pasos, que se pueden tocar para mover el pedido (también hacia atrás)
// - <BotonAvanzar>    junto a los pasos del pedido
// - <PagoConfirmado>  y <DescuentoPedido> dentro de la hoja del pago
// - <AnularPedido>    aparte, al final
// (Confirmar por WhatsApp e Imprimir comandas son enlaces: están en page.tsx.)

/** Corre una acción del servidor y guarda el error, si lo hay, para mostrarlo al lado. */
function useAccion() {
  const [enCurso, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function ejecutar(accion: () => Promise<ResultadoAccion>, alTerminar?: () => void) {
    setError(null)
    iniciar(async () => {
      const resultado = await accion()
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      alTerminar?.()
    })
  }

  return { enCurso, error, setError, ejecutar }
}

const MensajeError = ({ error }: { error: string | null }) =>
  error ? (
    <p role="alert" className="pn-alert pn-alert--error mt-3">
      {error}
    </p>
  ) : null

interface AccionesEstadoProps {
  pedidoId: number
  numero: number
  estado: EstadoPedido
  /** Texto del botón que avanza al paso siguiente (null si el pedido ya terminó). */
  etiquetaAvance: string | null
}

/**
 * Acción principal según el estado: un pedido pendiente se confirma (cuadro con tiempo,
 * impresión y aviso por WhatsApp) o se rechaza; después, se avanza paso a paso.
 * Va siempre en el mismo lugar de la pantalla: así, cuando la página se actualiza tras
 * confirmar o rechazar, el cuadro sigue abierto con el botón para avisar al cliente.
 */
export function AccionesEstado({ pedidoId, numero, estado, etiquetaAvance }: AccionesEstadoProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [rechazando, setRechazando] = useState(false)

  return (
    <div>
      {estado === 'pendiente' && !rechazando && (
        <>
          <p className="pn-eyebrow mb-3">Pedido nuevo</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default" size="lg" onClick={() => setConfirmando(true)}>
              Confirmar pedido
            </Button>
            <Button variant="destructive" onClick={() => setRechazando(true)}>
              Rechazar
            </Button>
          </div>
        </>
      )}

      {estado !== 'pendiente' && !rechazando && etiquetaAvance && (
        <>
          <p className="pn-eyebrow mb-3">Siguiente paso</p>
          <BotonAvanzar pedidoId={pedidoId} etiqueta={etiquetaAvance} />
        </>
      )}

      {rechazando && <RechazarPedido pedidoId={pedidoId} onCerrar={() => setRechazando(false)} />}

      <CuadroConfirmar
        abierto={confirmando}
        titulo={`Confirmar pedido N° ${String(numero).padStart(4, '0')}`}
        textoConfirmar="Confirmar pedido"
        onConfirmar={async (minutos) => {
          const resultado = await confirmarPedido(pedidoId, minutos, true)
          return resultado.ok ? { ok: true, pedidoId, numero, linkWhatsApp: resultado.linkWhatsApp } : resultado
        }}
        onCerrar={() => setConfirmando(false)}
      />
    </div>
  )
}

/** Rechazar un pedido pendiente: motivo rápido (o escrito) y, si se quiere, aviso por WhatsApp. */
function RechazarPedido({ pedidoId, onCerrar }: { pedidoId: number; onCerrar: () => void }) {
  const [enCurso, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [otro, setOtro] = useState('')
  const [hecho, setHecho] = useState<{ linkWhatsApp: string | null } | null>(null)

  const motivo = elegido === 'otro' ? otro.trim() : (elegido ?? '')

  function rechazar() {
    setError(null)
    iniciar(async () => {
      const resultado = await rechazarPedido(pedidoId, motivo, true)
      if (!resultado.ok) return setError(resultado.error)
      setHecho({ linkWhatsApp: resultado.linkWhatsApp })
    })
  }

  if (hecho) {
    return (
      <div className="space-y-3">
        <p className="pn-alert pn-alert--ok">Pedido rechazado. Quedó en Cancelados con el motivo.</p>
        <div className="flex flex-wrap gap-2">
          {hecho.linkWhatsApp && (
            <a
              href={hecho.linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'secondary' })}
            >
              <IconoWhatsApp className="size-4" />
              Avisar al cliente por WhatsApp
            </a>
          )}
          <Button variant="ghost" onClick={onCerrar}>
            Listo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="pn-label">¿Por qué se rechaza?</p>
      <div className="flex flex-wrap gap-2">
        {[...MOTIVOS_RECHAZO, 'otro'].map((m) => (
          <button
            key={m}
            type="button"
            className="pn-option"
            aria-pressed={elegido === m}
            onClick={() => setElegido(m)}
          >
            {m === 'otro' ? 'Otro motivo' : m}
          </button>
        ))}
      </div>
      {elegido === 'otro' && (
        <textarea
          value={otro}
          onChange={(e) => setOtro(e.target.value)}
          maxLength={300}
          rows={2}
          autoFocus
          aria-label="Motivo del rechazo"
          placeholder="Escribí el motivo"
          className="pn-field"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" disabled={enCurso || motivo.length < 3} onClick={rechazar}>
          {enCurso ? 'Rechazando…' : 'Rechazar pedido'}
        </Button>
        <Button variant="ghost" disabled={enCurso} onClick={onCerrar}>
          Volver
        </Button>
      </div>
      <MensajeError error={error} />
    </div>
  )
}

/** Imprime las comandas sin salir de la pantalla (sale el diálogo de impresión). */
export function BotonImprimirComandas({ pedidoId }: { pedidoId: number }) {
  return (
    <Button variant="outline" size="sm" onClick={() => void imprimirComandas(pedidoId)}>
      <Printer />
      Imprimir comandas
    </Button>
  )
}

/** Botón principal de la pantalla: pasa el pedido al estado que sigue. */
export function BotonAvanzar({ pedidoId, etiqueta }: { pedidoId: number; etiqueta: string }) {
  const { enCurso, error, ejecutar } = useAccion()

  return (
    <div>
      <Button variant="default" size="lg" disabled={enCurso} onClick={() => ejecutar(() => avanzarPedido(pedidoId))}>
        {etiqueta}
      </Button>
      <MensajeError error={error} />
    </div>
  )
}

interface PasosProps {
  pedidoId: number
  pasos: EstadoPedido[]
  estadoActual: EstadoPedido
  cancelado: boolean
}

/**
 * Pasos del pedido. Cada paso es un botón: sirve para volver atrás si se marcó uno por error
 * (o para saltear uno). Antes de cambiar pide confirmación, así un toque sin querer no mueve nada.
 */
export function PasosPedido({ pedidoId, pasos, estadoActual, cancelado }: PasosProps) {
  const { enCurso, error, setError, ejecutar } = useAccion()
  const [elegido, setElegido] = useState<EstadoPedido | null>(null)
  const actual = pasos.indexOf(estadoActual)

  const estadoDelPaso = (indice: number) => {
    if (cancelado || indice > actual) return 'pendiente'
    // El último paso (entregado) no queda «en curso»: ya está hecho
    return indice < actual || indice === pasos.length - 1 ? 'hecho' : 'actual'
  }

  function confirmar() {
    if (!elegido) return
    ejecutar(() => cambiarEstado(pedidoId, elegido), () => setElegido(null))
  }

  const vuelveAtras = elegido !== null && pasos.indexOf(elegido) < actual

  return (
    <div>
      <ol className="pn-steps mt-6" aria-label="Pasos del pedido">
        {pasos.map((paso, indice) => {
          const estadoPaso = estadoDelPaso(indice)
          const esActual = paso === estadoActual
          return (
            <li
              key={paso}
              className="pn-step"
              data-paso={estadoPaso}
              aria-current={estadoPaso === 'actual' ? 'step' : undefined}
            >
              <button
                type="button"
                className="pn-step__btn"
                data-elegido={elegido === paso || undefined}
                disabled={cancelado || esActual || enCurso}
                onClick={() => {
                  setError(null)
                  setElegido(paso)
                }}
                aria-label={esActual ? `${ETIQUETA_ESTADO[paso]} (estado actual)` : `Pasar el pedido a ${ETIQUETA_ESTADO[paso]}`}
              >
                <span className="pn-step__num" aria-hidden="true">
                  {estadoPaso === 'hecho' ? <Check className="size-5" strokeWidth={3} /> : indice + 1}
                </span>
                <span className="pn-step__name">{ETIQUETA_ESTADO[paso]}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {elegido ? (
        <div role="alertdialog" aria-label="Confirmar cambio de estado" className="pn-alert pn-alert--warn mt-5">
          <p className="font-bold">
            ¿Pasar el pedido a «{ETIQUETA_ESTADO[elegido]}»?
          </p>
          {vuelveAtras && (
            <p className="mt-1 text-sm font-medium">Vuelve atrás: el cliente lo va a ver así en su seguimiento.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="default" size="sm" disabled={enCurso} onClick={confirmar}>
              {enCurso ? 'Cambiando…' : 'Sí, cambiar'}
            </Button>
            <Button variant="ghost" size="sm" disabled={enCurso} onClick={() => setElegido(null)}>
              No
            </Button>
          </div>
        </div>
      ) : (
        !cancelado && (
          <p className="pn-muted mt-4 text-xs font-medium">
            Tocá un paso para mover el pedido; sirve para volver atrás si te equivocaste.
          </p>
        )
      )}
      <MensajeError error={error} />
    </div>
  )
}

/** Botón para marcar que la transferencia llegó (o deshacerlo si se marcó por error). */
export function PagoConfirmado({ pedidoId, confirmado }: { pedidoId: number; confirmado: boolean }) {
  const { enCurso, error, ejecutar } = useAccion()

  return (
    <div>
      {confirmado ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={enCurso}
          onClick={() => ejecutar(() => confirmarPago(pedidoId, false))}
        >
          Deshacer: la transferencia no llegó
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          disabled={enCurso}
          onClick={() => ejecutar(() => confirmarPago(pedidoId, true))}
        >
          <Check strokeWidth={3} />
          {enCurso ? 'Guardando…' : 'La transferencia llegó'}
        </Button>
      )}
      <MensajeError error={error} />
    </div>
  )
}

/** Descuento de cada producto del pedido, en porcentaje. El total lo recalcula el servidor. */
export function DescuentoPedido({
  pedidoId,
  items,
}: {
  pedidoId: number
  items: { id: number; nombre: string; cantidad: number; descuentoPorcentaje: number }[]
}) {
  const { enCurso, error, setError, ejecutar } = useAccion()
  const [valores, setValores] = useState<Record<number, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.descuentoPorcentaje > 0 ? String(i.descuentoPorcentaje) : ''])),
  )

  function guardar() {
    const descuentos = items.map((i) => ({ itemId: i.id, porcentaje: Number(valores[i.id]) || 0 }))
    if (descuentos.some((d) => !Number.isInteger(d.porcentaje) || d.porcentaje < 0 || d.porcentaje > 100)) {
      setError('El descuento debe ser un número entero entre 0 y 100.')
      return
    }
    ejecutar(() => aplicarDescuentos(pedidoId, descuentos))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        guardar()
      }}
    >
      <p className="pn-label">Descuento por producto %</p>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3">
            <label htmlFor={`descuento-${i.id}`} className="min-w-0 truncate text-sm font-semibold">
              <strong className="font-extrabold">{i.cantidad}x</strong> {i.nombre}
            </label>
            <input
              id={`descuento-${i.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={valores[i.id] ?? ''}
              onChange={(e) => setValores((actual) => ({ ...actual, [i.id]: e.target.value }))}
              placeholder="0"
              className="pn-field w-20 flex-none"
            />
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Button type="submit" size="sm" disabled={enCurso}>
          {enCurso ? 'Aplicando…' : 'Aplicar descuentos'}
        </Button>
      </div>
      <MensajeError error={error} />
    </form>
  )
}

type Panel = 'cancelar' | 'borrar' | null

/** Cancelar o borrar el pedido. Las dos piden un motivo antes de confirmar. */
export function AnularPedido({ pedidoId, sePuedeCancelar }: { pedidoId: number; sePuedeCancelar: boolean }) {
  const router = useRouter()
  const { enCurso, error, setError, ejecutar } = useAccion()
  const [panel, setPanel] = useState<Panel>(null)
  const [motivo, setMotivo] = useState('')

  function cerrarPanel() {
    setPanel(null)
    setMotivo('')
    setError(null)
  }

  function confirmarMotivo() {
    if (panel === 'cancelar') {
      ejecutar(() => cancelarPedido(pedidoId, motivo), cerrarPanel)
    } else if (panel === 'borrar') {
      ejecutar(() => borrarPedido(pedidoId, motivo), () => router.push('/admin/pedidos'))
    }
  }

  if (panel) {
    return (
      <div className="space-y-3">
        <label htmlFor="motivo" className="pn-label">
          {panel === 'cancelar' ? 'Motivo de la cancelación' : 'Motivo del borrado'} (obligatorio)
        </label>
        <textarea
          id="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={300}
          rows={3}
          autoFocus
          className="pn-field"
          placeholder={panel === 'cancelar' ? 'Ej.: el cliente no respondió' : 'Ej.: pedido duplicado'}
        />
        <p className="pn-muted text-xs font-medium">
          {panel === 'borrar'
            ? 'El pedido deja de verse en la lista, pero queda registrado con este motivo.'
            : 'El pedido queda como cancelado y no se suma al cierre de caja.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" disabled={enCurso || motivo.trim().length < 3} onClick={confirmarMotivo}>
            {panel === 'cancelar' ? 'Confirmar cancelación' : 'Confirmar borrado'}
          </Button>
          <Button variant="ghost" onClick={cerrarPanel} disabled={enCurso}>
            Volver
          </Button>
        </div>
        <MensajeError error={error} />
      </div>
    )
  }

  return (
    <div className="pn-rows">
      {sePuedeCancelar && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <p className="min-w-56 flex-1 text-sm">
            <strong className="block font-bold">Cancelar</strong>
            <span className="pn-muted font-medium">Queda en la lista como cancelado y no suma a la caja.</span>
          </p>
          <Button variant="destructive" size="sm" onClick={() => setPanel('cancelar')}>
            Cancelar pedido
          </Button>
        </div>
      )}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${sePuedeCancelar ? 'pt-4' : ''}`}>
        <p className="min-w-56 flex-1 text-sm">
          <strong className="block font-bold">Borrar</strong>
          <span className="pn-muted font-medium">Deja de verse en la lista. Queda registrado con el motivo.</span>
        </p>
        <Button size="sm" onClick={() => setPanel('borrar')}>
          Borrar pedido
        </Button>
      </div>
    </div>
  )
}

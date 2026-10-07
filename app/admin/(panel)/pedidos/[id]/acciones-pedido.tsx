'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { PanchoButton } from '@/components/pancho-button'
import { Button } from '@/components/ui/button'
import { avanzarPedido, borrarPedido, cancelarPedido, confirmarPago, type ResultadoAccion } from '@/lib/orders/actions'

// Las acciones del pedido van repartidas por la pantalla, cada una al lado de lo que cambia:
// - <BotonAvanzar>   junto a los pasos del pedido
// - <PagoConfirmado> dentro de la hoja del pago
// - <AnularPedido>   aparte, al final
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

/** Botón principal de la pantalla: pasa el pedido al estado que sigue. */
export function BotonAvanzar({ pedidoId, etiqueta }: { pedidoId: number; etiqueta: string }) {
  const { enCurso, error, ejecutar } = useAccion()

  return (
    <div>
      <PanchoButton size="lg" disabled={enCurso} onClick={() => ejecutar(() => avanzarPedido(pedidoId))}>
        {etiqueta}
      </PanchoButton>
      <MensajeError error={error} />
    </div>
  )
}

/** Casilla para marcar que la transferencia ya llegó. */
export function PagoConfirmado({ pedidoId, confirmado }: { pedidoId: number; confirmado: boolean }) {
  const { enCurso, error, ejecutar } = useAccion()

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
        <input
          type="checkbox"
          checked={confirmado}
          disabled={enCurso}
          onChange={(e) => ejecutar(() => confirmarPago(pedidoId, e.target.checked))}
          className="pn-check"
        />
        La transferencia ya llegó
      </label>
      <MensajeError error={error} />
    </div>
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

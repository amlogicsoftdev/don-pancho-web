'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { avanzarPedido, borrarPedido, cancelarPedido, confirmarPago, type ResultadoAccion } from '@/lib/orders/actions'

interface Props {
  pedidoId: number
  etiquetaAvance: string | null
  sePuedeCancelar: boolean
  linkWhatsApp: string
  esTransferencia: boolean
  pagoConfirmado: boolean
}

type Panel = 'cancelar' | 'borrar' | null

export function AccionesPedido({
  pedidoId,
  etiquetaAvance,
  sePuedeCancelar,
  linkWhatsApp,
  esTransferencia,
  pagoConfirmado,
}: Props) {
  const router = useRouter()
  const [enCurso, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [motivo, setMotivo] = useState('')

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

  function confirmarMotivo() {
    if (panel === 'cancelar') {
      ejecutar(() => cancelarPedido(pedidoId, motivo), () => cerrarPanel())
    } else if (panel === 'borrar') {
      ejecutar(() => borrarPedido(pedidoId, motivo), () => router.push('/admin/pedidos'))
    }
  }

  function cerrarPanel() {
    setPanel(null)
    setMotivo('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {etiquetaAvance && (
          <Button
            size="lg"
            disabled={enCurso}
            onClick={() => ejecutar(() => avanzarPedido(pedidoId))}
            className="h-10 bg-cheesy-yellow px-4 text-cheesy-black hover:bg-cheesy-yellow-bright"
          >
            {etiquetaAvance}
          </Button>
        )}
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-lg border border-emerald-400/50 px-4 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
        >
          Confirmar por WhatsApp
        </a>
        <Link
          href={`/admin/pedidos/${pedidoId}/comandas`}
          target="_blank"
          className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold hover:bg-white/5"
        >
          Imprimir comandas
        </Link>
      </div>

      {esTransferencia && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pagoConfirmado}
            disabled={enCurso}
            onChange={(e) => ejecutar(() => confirmarPago(pedidoId, e.target.checked))}
            className="size-4 accent-cheesy-yellow"
          />
          La transferencia ya llegó (pago confirmado)
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {sePuedeCancelar && (
          <Button variant="destructive" size="lg" className="h-9 px-3" onClick={() => setPanel('cancelar')} disabled={enCurso}>
            Cancelar pedido
          </Button>
        )}
        <Button variant="outline" size="lg" className="h-9 px-3" onClick={() => setPanel('borrar')} disabled={enCurso}>
          Borrar pedido
        </Button>
      </div>

      {panel && (
        <div className="space-y-3 rounded-xl border border-white/15 bg-cheesy-black p-4">
          <label className="block text-sm font-semibold" htmlFor="motivo">
            {panel === 'cancelar' ? 'Motivo de la cancelación' : 'Motivo del borrado'} (obligatorio)
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full rounded-lg border border-white/15 bg-cheesy-surface p-2 text-sm outline-none focus:border-cheesy-yellow"
            placeholder={panel === 'cancelar' ? 'Ej.: el cliente no respondió' : 'Ej.: pedido duplicado'}
          />
          <p className="text-xs text-cheesy-muted">
            {panel === 'borrar'
              ? 'El pedido deja de verse en la lista, pero queda registrado con este motivo.'
              : 'El pedido queda como cancelado y no se suma al cierre de caja.'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="lg"
              className="h-9 px-3"
              disabled={enCurso || motivo.trim().length < 3}
              onClick={confirmarMotivo}
            >
              {panel === 'cancelar' ? 'Confirmar cancelación' : 'Confirmar borrado'}
            </Button>
            <Button variant="ghost" size="lg" className="h-9 px-3" onClick={cerrarPanel} disabled={enCurso}>
              Volver
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
    </div>
  )
}

'use client'

import { Check, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IconoWhatsApp } from '@/components/icono-whatsapp'
import { PanchoButton } from '@/components/pancho-button'
import { Button, buttonVariants } from '@/components/ui/button'
import { TIEMPOS_ENTREGA, etiquetaTiempo, formatearNumero } from '@/lib/orders/estados'
import { imprimirComandas } from './imprimir-comandas'

export type ResultadoConfirmar =
  | { ok: true; pedidoId: number; numero: number; linkWhatsApp: string | null }
  | { ok: false; error: string }

interface Props {
  abierto: boolean
  titulo: string
  /** Texto del botón que confirma (por ejemplo "Confirmar pedido" o "Registrar venta"). */
  textoConfirmar: string
  onConfirmar: (minutos: number) => Promise<ResultadoConfirmar>
  onCerrar: () => void
}

/**
 * Cuadro para confirmar un pedido (web o mostrador):
 * 1. se elige el tiempo de entrega (no tiene valor por defecto: hay que elegirlo);
 * 2. al confirmar se imprimen las comandas en el momento;
 * 3. queda el botón para notificar al cliente por WhatsApp con el mensaje ya armado.
 */
export function CuadroConfirmar({ abierto, titulo, textoConfirmar, onConfirmar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [minutos, setMinutos] = useState<number | null>(null)
  const [enCurso, setEnCurso] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<{ pedidoId: number; numero: number; linkWhatsApp: string | null } | null>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  function cerrar() {
    if (enCurso) return
    setMinutos(null)
    setError(null)
    setHecho(null)
    onCerrar()
  }

  async function confirmar() {
    if (minutos === null) return setError('Elegí el tiempo de entrega.')
    setError(null)
    setEnCurso(true)
    const resultado = await onConfirmar(minutos)
    if (!resultado.ok) {
      setEnCurso(false)
      return setError(resultado.error)
    }
    setHecho(resultado)
    setEnCurso(false)
    // Las comandas salen en el momento, sin salir de esta pantalla
    void imprimirComandas(resultado.pedidoId)
  }

  return (
    <dialog
      ref={ref}
      className="pn-dialog"
      aria-labelledby="cuadro-confirmar-titulo"
      onCancel={(e) => {
        e.preventDefault()
        cerrar()
      }}
    >
      {hecho ? (
        <div className="space-y-5">
          <div>
            <p className="pn-eyebrow">Listo</p>
            <h2 id="cuadro-confirmar-titulo" className="mt-1 text-3xl leading-none">
              N° {formatearNumero(hecho.numero)} confirmado
            </h2>
            <p className="pn-muted mt-2 flex items-center gap-1.5 text-sm font-semibold">
              <Printer className="size-4" aria-hidden="true" /> Se mandaron a imprimir las comandas.
            </p>
          </div>

          {hecho.linkWhatsApp ? (
            <a
              href={hecho.linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full' })}
            >
              <IconoWhatsApp className="size-5" />
              Notificar por WhatsApp
            </a>
          ) : (
            <p className="pn-alert pn-alert--warn">No dejó teléfono: no se le puede avisar por WhatsApp.</p>
          )}

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => void imprimirComandas(hecho.pedidoId)}>
              <Printer /> Volver a imprimir
            </Button>
            <Button size="sm" onClick={cerrar}>
              <Check strokeWidth={3} /> Listo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <h2 id="cuadro-confirmar-titulo" className="text-3xl leading-none">
            {titulo}
          </h2>

          <fieldset>
            <legend className="pn-label">Tiempo de entrega</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {TIEMPOS_ENTREGA.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="pn-option px-2"
                  aria-pressed={minutos === t}
                  onClick={() => setMinutos(t)}
                >
                  {etiquetaTiempo(t)}
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="pn-alert pn-alert--error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <PanchoButton disabled={enCurso} onClick={confirmar}>
              {enCurso ? 'Confirmando…' : textoConfirmar}
            </PanchoButton>
            <Button variant="ghost" disabled={enCurso} onClick={cerrar}>
              Volver
            </Button>
          </div>
          <p className="pn-muted text-xs font-medium">
            Al confirmar se imprimen las comandas y queda el botón para avisarle al cliente por WhatsApp.
          </p>
        </div>
      )}
    </dialog>
  )
}

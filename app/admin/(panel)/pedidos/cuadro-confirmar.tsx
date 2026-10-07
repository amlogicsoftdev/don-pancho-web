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
  // Mientras está abierto el diálogo de impresión, el cuadro no se cierra (ni con Escape)
  const [imprimiendo, setImprimiendo] = useState(false)
  const ocupado = enCurso || imprimiendo

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // Se cierra el cuadro directamente (no espera a que la pantalla de atrás se actualice) y el
  // evento "close" del cuadro avisa al resto. Así funciona aunque la página se haya refrescado
  // tras confirmar.
  function cerrar() {
    if (ocupado) return
    if (ref.current?.open) ref.current.close()
    else alCerrarse()
  }

  function alCerrarse() {
    setMinutos(null)
    setError(null)
    setHecho(null)
    onCerrar()
  }

  /** Imprime y recién al cerrarse el diálogo de impresión vuelve a habilitar el cuadro. */
  async function imprimir(pedidoId: number) {
    setImprimiendo(true)
    try {
      await imprimirComandas(pedidoId)
    } finally {
      setImprimiendo(false)
    }
  }

  async function confirmar() {
    if (minutos === null) return setError('Elegí el tiempo de entrega.')
    setError(null)
    setEnCurso(true)
    const resultado = await onConfirmar(minutos)
    setEnCurso(false)
    if (!resultado.ok) return setError(resultado.error)
    setHecho(resultado)
    // Las comandas salen en el momento, sin salir de esta pantalla
    await imprimir(resultado.pedidoId)
  }

  return (
    <dialog
      ref={ref}
      className="pn-dialog"
      aria-labelledby="cuadro-confirmar-titulo"
      onCancel={(e) => {
        // Escape: no cierra mientras se confirma o se imprime (el Escape que cierra la vista
        // previa de impresión no tiene que cerrar también este cuadro)
        if (ocupado) e.preventDefault()
      }}
      onClose={alCerrarse}
    >
      {hecho && imprimiendo ? (
        <div className="space-y-3 py-4 text-center" role="status">
          <Printer className="mx-auto size-10" aria-hidden="true" />
          <h2 id="cuadro-confirmar-titulo" className="text-3xl leading-none">
            Imprimiendo comandas…
          </h2>
          <p className="pn-muted text-sm font-semibold">
            N° {formatearNumero(hecho.numero)} confirmado. Elegí la impresora en el diálogo; al cerrarlo, queda el botón
            para avisarle al cliente.
          </p>
        </div>
      ) : hecho ? (
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
            <Button variant="ghost" size="sm" onClick={() => void imprimir(hecho.pedidoId)}>
              <Printer /> Volver a imprimir
            </Button>
            <button type="button" className={buttonVariants({ variant: 'default', size: 'sm' })} onClick={cerrar}>
              <Check strokeWidth={3} /> Listo
            </button>
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

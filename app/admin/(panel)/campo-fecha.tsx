'use client'

import { CalendarDays } from 'lucide-react'
import { useRef } from 'react'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  etiqueta: string
}

/**
 * Campo de fecha con un ícono de calendario: al tocar el ícono (o el campo) se abre el
 * calendario del navegador. Sirve dentro de formularios normales (se envía con su `name`).
 */
export function CampoFecha({ etiqueta, className = '', ...input }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  function abrirCalendario() {
    const campo = ref.current
    if (!campo) return
    try {
      // showPicker() abre el calendario; si el navegador no lo permite, queda el campo con el foco
      campo.showPicker()
    } catch {
      campo.focus()
    }
  }

  return (
    <label className={`block ${className}`}>
      <span className="pn-label">{etiqueta}</span>
      <span className="relative block">
        <input
          ref={ref}
          type="date"
          onClick={abrirCalendario}
          className="pn-field pn-field--fecha w-full pr-12"
          {...input}
        />
        <button
          type="button"
          onClick={abrirCalendario}
          aria-label={`Abrir calendario: ${etiqueta}`}
          className="absolute inset-y-0.5 right-0.5 grid w-10 cursor-pointer place-items-center border-l-2 border-pancho-black bg-pancho-orange text-pancho-black transition-colors hover:bg-pancho-black hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
        >
          <CalendarDays className="size-5" aria-hidden="true" />
        </button>
      </span>
    </label>
  )
}

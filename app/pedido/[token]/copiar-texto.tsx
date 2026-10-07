'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Botón chico para copiar un dato (alias o CBU) al portapapeles. */
export function CopiarTexto({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      // Sin permiso de portapapeles: el dato igual se puede seleccionar a mano
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar ${etiqueta}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-700 px-2.5 text-xs font-bold uppercase tracking-[0.04em] text-neutral-300 hover:border-pancho-orange hover:text-pancho-orange cursor-pointer"
    >
      {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  )
}

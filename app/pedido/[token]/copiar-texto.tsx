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
      className="inline-flex min-h-9 items-center gap-1.5 border-2 border-pancho-black bg-white px-2.5 text-xs font-extrabold uppercase tracking-[0.04em] text-pancho-black hover:bg-pancho-black hover:text-white cursor-pointer"
    >
      {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  )
}

'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef } from 'react'

const CLAVE = 'donpancho_bloques_cerrados'

function leerCerrados(): string[] {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(datos) ? datos.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

interface Props {
  /** Identifica el bloque para recordar si quedó cerrado (por ejemplo, el estado). */
  id: string
  titulo: string
  cantidad: number
  children: React.ReactNode
}

/**
 * Bloque de la lista de pedidos que se puede plegar o desplegar con la flecha de la derecha.
 * Recuerda en este navegador si quedó cerrado: la lista se refresca sola cuando entran pedidos
 * y no tiene que volver a abrirse.
 */
export function BloquePedidos({ id, titulo, cantidad, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null)

  // Al montar, se aplica lo que quedó guardado (abierto por defecto)
  useEffect(() => {
    if (ref.current && leerCerrados().includes(id)) ref.current.open = false
  }, [id])

  function alCambiar() {
    const abierto = ref.current?.open ?? true
    const cerrados = new Set(leerCerrados())
    if (abierto) cerrados.delete(id)
    else cerrados.add(id)
    try {
      localStorage.setItem(CLAVE, JSON.stringify([...cerrados]))
    } catch {
      // Sin almacenamiento: el bloque se pliega igual, solo que no se recuerda
    }
  }

  return (
    <details ref={ref} open onToggle={alCambiar} className="pn-bloque group">
      <summary className="pn-bloque__titulo">
        <h2 className="flex items-center gap-3 text-2xl leading-none">
          {titulo}
          <span className="pn-count">{cantidad}</span>
        </h2>
        <span className="pn-bloque__flecha" aria-hidden="true">
          <ChevronDown className="size-5 transition-transform duration-200 group-open:rotate-180" strokeWidth={3} />
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'

interface ControlCantidadProps {
  /** Nombre del plato, para los textos de los lectores de pantalla. */
  nombre: string
  cantidad: number
  onAgregar: () => void
  onCambiar: (delta: 1 | -1) => void
}

/**
 * Botón de agregar de cada plato de la carta. Es un solo control que se transforma: el + se
 * queda en su lugar y la caja se estira para mostrar − y la cantidad (y se encoge al volver a
 * cero). Al cambiar la cantidad, el número sube o baja. Los estilos están en app/globals.css,
 * bajo «Cantidad».
 */
export function ControlCantidad({ nombre, cantidad, onAgregar, onCambiar }: ControlCantidadProps) {
  const abierto = cantidad > 0
  // Cuándo se abrió: mientras se estira, el − todavía no responde. Así un doble toque rápido
  // sobre el + no suma y resta (en el celular la caja crece hacia la derecha y el − queda
  // justo donde se tocó).
  const abrioEn = useRef(0)

  // Para que el número entre desde abajo al sumar y desde arriba al restar
  const [anterior, setAnterior] = useState(cantidad)
  const [sube, setSube] = useState(true)
  if (cantidad !== anterior) {
    setSube(cantidad > anterior)
    setAnterior(cantidad)
  }

  return (
    <div className="cantidad" data-abierto={abierto}>
      <button
        type="button"
        className="cantidad__menos"
        onClick={() => {
          if (performance.now() - abrioEn.current < 450) return
          onCambiar(-1)
        }}
        aria-label={`Quitar uno de ${nombre}`}
        inert={!abierto}
      >
        −
      </button>
      <span className="cantidad__numero" inert={!abierto} aria-live="polite">
        {/* La key hace que cada número nuevo entre con su animación */}
        <span key={cantidad} className="cantidad__digito" data-sube={sube}>
          {abierto ? cantidad : ''}
        </span>
        <span className="sr-only">{abierto ? ` en tu pedido` : ''}</span>
      </span>
      <button
        type="button"
        className="cantidad__mas"
        onClick={() => {
          if (abierto) return onCambiar(1)
          abrioEn.current = performance.now()
          onAgregar()
        }}
        aria-label={abierto ? `Agregar otro ${nombre}` : `Agregar ${nombre} al pedido`}
      >
        <Plus className="size-4.5 stroke-3" aria-hidden="true" />
      </button>
    </div>
  )
}

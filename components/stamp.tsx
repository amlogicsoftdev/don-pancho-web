import React from 'react'
import { Flame } from 'lucide-react'

interface StampProps {
  className?: string
}

/**
 * Sello redondo de la marca: el texto gira despacio alrededor de la llama.
 * Es decorativo (lo que dice ya está escrito en la página), por eso va oculto
 * para lectores de pantalla. Estilos en app/globals.css, bajo «Sello».
 */
export function Stamp({ className = '' }: StampProps) {
  return (
    <div className={`stamp ${className}`} aria-hidden="true">
      <svg viewBox="0 0 160 160" className="stamp-ring">
        <defs>
          {/* círculo de radio 60, en sentido horario y arrancando a la izquierda */}
          <path id="dp-stamp-path" d="M 20,80 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" />
        </defs>
        <circle cx="80" cy="80" r="50" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
        <text>
          <textPath href="#dp-stamp-path" textLength="372" lengthAdjust="spacing">
            Hamburguesas y panchos · Delivery y retiro ·
          </textPath>
        </text>
      </svg>
      <Flame className="stamp-icon" strokeWidth={2} />
    </div>
  )
}

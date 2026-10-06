import React from 'react'

interface SplitLinesProps {
  /** Cada elemento es una línea del título. */
  lines: string[]
}

/**
 * Parte un título en líneas para que entren una por una desde atrás de una máscara.
 *
 * Va adentro del título (h1, h2…). El título decide cuándo se anima con una clase:
 * `load-lines` al cargar la página o `rv-lines` al entrar en pantalla. Los estilos
 * están en app/globals.css, bajo «Entradas».
 */
export function SplitLines({ lines }: SplitLinesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <span key={line} className="line-mask">
          <span className="line" style={{ '--i': index } as React.CSSProperties}>
            {line}
          </span>
          {/* espacio entre líneas para lectores de pantalla y para copiar el texto */}
          {index < lines.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  )
}

import React from 'react'

interface SplitLinesProps {
  /** Cada elemento es una línea del título. */
  lines: string[]
  /** Palabras que van en naranja (sin importar mayúsculas). */
  accentWords?: string[]
}

/**
 * Parte un título en líneas, palabras y letras para que las letras se paren una por una.
 *
 * Va adentro del título (h1, h2…). El título decide cuándo se anima con una clase:
 * `load-chars` al cargar la página o `rv-chars` al entrar en pantalla. Los estilos
 * están en app/globals.css, bajo «Entradas».
 *
 * No usa máscaras: cada letra se ve entera todo el tiempo, nada queda cortado.
 * Los lectores de pantalla reciben el texto completo de una sola vez; las letras
 * sueltas van ocultas para ellos.
 */
export function SplitLines({ lines, accentWords = [] }: SplitLinesProps) {
  // Número de cada letra dentro del título completo: de ahí sale su retraso
  const offsets = lines.map((_, lineIndex) =>
    lines.slice(0, lineIndex).reduce((total, line) => total + line.replace(/\s/g, '').length, 0),
  )

  return (
    <>
      <span className="sr-only">{lines.join(' ')}</span>
      <span aria-hidden="true">
        {lines.map((line, lineIndex) => {
          const words = line.split(' ')
          return (
            <span key={line} className="tx-line">
              {words.map((word, wordIndex) => {
                const before = words.slice(0, wordIndex).reduce((total, w) => total + w.length, 0)
                return (
                  <React.Fragment key={`${word}-${wordIndex}`}>
                    {wordIndex > 0 ? ' ' : null}
                    <span
                      className={
                        accentWords.some((accent) => accent.toLowerCase() === word.toLowerCase())
                          ? 'tx-word text-pancho-orange'
                          : 'tx-word'
                      }
                    >
                      {Array.from(word).map((char, charIndex) => (
                        <span
                          key={charIndex}
                          className="tx-char"
                          style={{ '--i': offsets[lineIndex] + before + charIndex } as React.CSSProperties}
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                  </React.Fragment>
                )
              })}
            </span>
          )
        })}
      </span>
    </>
  )
}

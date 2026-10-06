import React from 'react'

const WORDS = ['Hamburguesas', 'Panchos', 'Delivery', 'Retiro en el local', 'Pedí por la web', 'Combos']

/**
 * Cinta blanca con las palabras de la marca pasando sin parar, como una tira de afiches.
 * Una palabra de cada dos va en etiqueta roja recta.
 *
 * La lista se repite dos veces seguidas y la tira se desplaza la mitad de su ancho:
 * así el final empalma con el principio. La segunda copia va oculta para lectores
 * de pantalla. Estilos en app/globals.css, bajo «Cinta de texto en movimiento».
 */
export function MarqueeBand() {
  const group = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {WORDS.map((word, index) => (
        <li key={word} className="flex items-center px-4 sm:px-6">
          <span
            className={
              index % 2 === 1
                ? '-rotate-2 bg-pancho-red-deep px-2.5 py-0.5 text-white sm:px-3'
                : 'text-pancho-black'
            }
          >
            {word}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="marquee relative z-10 overflow-hidden bg-pancho-white py-3 font-display text-3xl leading-none whitespace-nowrap select-none sm:py-4 sm:text-5xl">
      <div className="marquee-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  )
}

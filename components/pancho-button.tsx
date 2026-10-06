import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type Variant = 'ink' | 'orange'
type Size = 'sm' | 'md' | 'lg'

interface ContentProps {
  children: React.ReactNode
  /** Ícono a la izquierda del texto. */
  icon?: React.ReactNode
}

interface StyleProps {
  /** `ink` (negro) para papel naranja o rojo; `orange` para fondo oscuro. */
  variant?: Variant
  size?: Size
  /** Ocupa todo el ancho de su contenedor. */
  block?: boolean
  className?: string
}

type ButtonProps = ContentProps &
  StyleProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: undefined
  }

type LinkProps = ContentProps &
  StyleProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> & {
    href: string
  }

/** Clases del botón, para usarlas en un elemento que no sea <button> ni enlace. */
export function panchoButtonClass({ variant = 'ink', size = 'md', block = false, className = '' }: StyleProps = {}) {
  return [
    'btn-pancho',
    variant === 'orange' ? 'btn-pancho--orange' : '',
    size === 'sm' ? 'btn-pancho--sm' : size === 'lg' ? 'btn-pancho--lg' : '',
    block ? 'btn-pancho--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Interior del botón: el texto (dos veces, la segunda es el relleno que barre
 * al pasar el mouse) y el cuadrado con la flecha que sale y vuelve a entrar.
 */
export function PanchoButtonContent({ children, icon }: ContentProps) {
  return (
    <>
      <span className="btn-pancho__label">
        <span className="btn-pancho__face">
          {icon}
          <span>{children}</span>
        </span>
        <span className="btn-pancho__face btn-pancho__face--fill" aria-hidden="true">
          {icon}
          <span>{children}</span>
        </span>
      </span>
      <span className="btn-pancho__chip" aria-hidden="true">
        <ArrowRight className="btn-pancho__arrow btn-pancho__arrow--out" strokeWidth={2.5} />
        <ArrowRight className="btn-pancho__arrow btn-pancho__arrow--in" strokeWidth={2.5} />
      </span>
    </>
  )
}

/**
 * Botón principal de Don Pancho. Con `href` es un enlace; sin `href`, un <button>.
 * Los estilos y los estados están en app/globals.css, bajo «Botón».
 */
export function PanchoButton(props: ButtonProps | LinkProps) {
  if (typeof props.href === 'string') {
    const { children, icon, variant, size, block, className, href, ...rest } = props
    return (
      <Link href={href} className={panchoButtonClass({ variant, size, block, className })} {...rest}>
        <PanchoButtonContent icon={icon}>{children}</PanchoButtonContent>
      </Link>
    )
  }

  const { children, icon, variant, size, block, className, href: _href, type = 'button', ...rest } = props
  void _href
  return (
    <button type={type} className={panchoButtonClass({ variant, size, block, className })} {...rest}>
      <PanchoButtonContent icon={icon}>{children}</PanchoButtonContent>
    </button>
  )
}

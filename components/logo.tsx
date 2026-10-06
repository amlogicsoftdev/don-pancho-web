'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface LogoProps {
  variant?: 'nav' | 'footer'
  className?: string
}

export function Logo({ variant = 'nav', className = '' }: LogoProps) {
  const isFooter = variant === 'footer'
  const pathname = usePathname()

  const handleClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <Link
      href="/#inicio"
      onClick={handleClick}
      className={`inline-flex items-center rounded-full transition-transform duration-300 ease-(--ease-out) hover:-rotate-8 active:scale-95 ${className}`}
      aria-label="Don Pancho & Burger - Volver al inicio"
    >
      {/* Sello redondo de Don Pancho & Burger, a color: va sobre naranja, rojo u oscuro.
          Al pasar el mouse gira apenas, como un sticker. */}
      <Image
        src="/images/logo-don-pancho.webp"
        alt="Don Pancho & Burger"
        width={512}
        height={512}
        priority={!isFooter}
        loading="eager"
        className={`w-auto object-contain ${
          isFooter ? 'h-28 sm:h-36' : 'h-14 sm:h-16'
        }`}
      />
    </Link>
  )
}

'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

interface TiltPhotoProps {
  src: string
  alt: string
  sizes: string
  /** Clases de la foto: encuadre con object-position, por ejemplo. */
  imageClassName?: string
  className?: string
  /** Lo que flota por delante de la foto (un sello). Se mueve más que el marco. */
  children?: React.ReactNode
}

/**
 * Foto en marco blanco con profundidad.
 *
 * - Con mouse: el marco se inclina hacia el cursor, la foto se mueve por dentro
 *   y un brillo sigue al puntero. Al salir, vuelve sola a su lugar.
 * - Al scrollear: la foto se desplaza apenas dentro del marco.
 * - Con «reducir movimiento» o en pantallas táctiles queda quieta.
 *
 * El componente solo escribe tres variables (--rx, --ry, --sy) en su propio
 * elemento; todo el movimiento está en app/globals.css, bajo «Foto con profundidad».
 * La entrada (se descubre de arriba hacia abajo) depende de que un contenedor
 * tenga data-inview="true".
 */
export function TiltPhoto({ src, alt, sizes, imageClassName = '', className = '', children }: TiltPhotoProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId: number | null = null
    let pointerX = 0
    let pointerY = 0
    let pointerDirty = false
    let scrollDirty = true

    const update = () => {
      rafId = null

      if (pointerDirty) {
        pointerDirty = false
        root.style.setProperty('--rx', pointerX.toFixed(3))
        root.style.setProperty('--ry', pointerY.toFixed(3))
      }

      if (scrollDirty) {
        scrollDirty = false
        const rect = root.getBoundingClientRect()
        const viewport = window.innerHeight
        // Fuera de pantalla no hace falta recalcular
        if (rect.bottom > 0 && rect.top < viewport) {
          // -1 cuando la foto asoma por abajo, 0 centrada, 1 cuando sale por arriba
          const offset = (viewport / 2 - (rect.top + rect.height / 2)) / (viewport / 2 + rect.height / 2)
          root.style.setProperty('--sy', Math.max(-1, Math.min(1, offset)).toFixed(3))
        }
      }
    }

    const requestUpdate = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    const handleScroll = () => {
      scrollDirty = true
      requestUpdate()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    requestUpdate()

    // La inclinación es solo para mouse: en táctil el «hover» queda pegado después de tocar
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const rect = root.getBoundingClientRect()
      pointerX = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5))
      pointerY = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5))
      pointerDirty = true
      root.dataset.tilt = 'on'
      requestUpdate()
    }

    const handlePointerLeave = () => {
      pointerX = 0
      pointerY = 0
      pointerDirty = true
      delete root.dataset.tilt
      requestUpdate()
    }

    if (canHover) {
      root.addEventListener('pointermove', handlePointerMove)
      root.addEventListener('pointerleave', handlePointerLeave)
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      root.removeEventListener('pointermove', handlePointerMove)
      root.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <div ref={rootRef} className={`tilt ${className}`}>
      {/* Marco blanco, girado como un afiche pegado */}
      <div className="tilt-card relative aspect-4/5 w-full -rotate-2 rounded-xs bg-white p-2 shadow-2xl sm:p-2.5">
        <div className="tilt-media relative h-full w-full overflow-hidden rounded-xs bg-pancho-surface">
          <Image src={src} alt={alt} fill sizes={sizes} className={`tilt-img object-cover ${imageClassName}`} />
          <span aria-hidden="true" className="tilt-sheen" />
        </div>
      </div>

      {children}
    </div>
  )
}

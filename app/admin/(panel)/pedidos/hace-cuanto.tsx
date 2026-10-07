'use client'

import { useEffect, useState } from 'react'

/** Minutos a partir de los que un pedido pendiente se marca como demorado. */
const DEMORA_MIN = 10

function texto(minutos: number): string {
  if (minutos < 1) return 'Recién'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `Hace ${horas} h ${minutos % 60} min`
}

/**
 * "Hace 11 min": tiempo desde que entró el pedido. Se actualiza solo cada 30 segundos.
 * Si el pedido sigue pendiente después de DEMORA_MIN minutos, se marca en rojo.
 */
export function HaceCuanto({ desde, pendiente }: { desde: string; pendiente: boolean }) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(intervalo)
  }, [])

  const minutos = Math.max(0, Math.floor((ahora - new Date(desde).getTime()) / 60_000))
  const demorado = pendiente && minutos >= DEMORA_MIN

  return (
    // El texto puede diferir unos segundos entre el servidor y el navegador
    <span suppressHydrationWarning className={demorado ? 'font-extrabold text-pancho-red-deep' : undefined}>
      {texto(minutos)}
      {demorado && ' · sin confirmar'}
    </span>
  )
}

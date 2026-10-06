'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// Devuelve false en el servidor y durante la hidratación, y true una vez montado en el navegador
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

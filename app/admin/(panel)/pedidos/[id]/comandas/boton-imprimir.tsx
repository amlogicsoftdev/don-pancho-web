'use client'

import { Printer } from 'lucide-react'
import { PanchoButton } from '@/components/pancho-button'

export function BotonImprimir() {
  return (
    <PanchoButton onClick={() => window.print()} icon={<Printer className="size-5" aria-hidden="true" />}>
      Imprimir comandas
    </PanchoButton>
  )
}

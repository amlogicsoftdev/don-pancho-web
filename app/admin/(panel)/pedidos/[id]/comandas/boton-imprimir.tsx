'use client'

import { Button } from '@/components/ui/button'

export function BotonImprimir() {
  return (
    <Button
      size="lg"
      onClick={() => window.print()}
      className="h-10 bg-cheesy-yellow px-4 text-cheesy-black hover:bg-cheesy-yellow-bright"
    >
      Imprimir las dos comandas
    </Button>
  )
}

'use client'

import { Button } from '@/components/ui/button'

export function BotonImprimir() {
  return (
    <Button
      size="lg"
      onClick={() => window.print()}
      className="h-10 bg-pancho-orange px-4 text-pancho-black hover:bg-pancho-orange-deep"
    >
      Imprimir las dos comandas
    </Button>
  )
}

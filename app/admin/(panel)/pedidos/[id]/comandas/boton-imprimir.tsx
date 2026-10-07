'use client'

import { Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { registrarImpresion } from '@/lib/orders/actions'

/** Imprime las comandas y suma la impresión (la próxima sale marcada como REIMPRESIÓN). */
export function BotonImprimir({ pedidoId }: { pedidoId: number }) {
  const router = useRouter()

  async function imprimir() {
    window.print()
    await registrarImpresion(pedidoId)
    router.refresh()
  }

  return (
    <Button variant="default" size="lg" onClick={imprimir}>
      <Printer aria-hidden="true" />
      Imprimir comandas
    </Button>
  )
}

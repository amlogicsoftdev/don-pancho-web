'use client'

import { Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PanchoButton } from '@/components/pancho-button'
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
    <PanchoButton onClick={imprimir} icon={<Printer className="size-5" aria-hidden="true" />}>
      Imprimir comandas
    </PanchoButton>
  )
}

'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/data'

interface BarraPedidoProps {
  cantidad: number
  total: number
  onAbrir: () => void
}

/**
 * Cartel de abajo con el pedido (abre el carrito). Sale desde abajo, como un ticket de la
 * comandera, cuando se agrega el primer producto, y vuelve a bajar cuando el pedido queda
 * vacío. Cada vez que se agrega algo da un saltito y la cantidad y el total suben como un
 * contador. Los estilos están en app/globals.css, bajo «Cartel del pedido».
 */
export function BarraPedido({ cantidad, total, onAbrir }: BarraPedidoProps) {
  const visible = cantidad > 0

  // Mientras baja al vaciarse, sigue mostrando lo último que tenía
  const [mostrado, setMostrado] = useState({ cantidad, total })
  // Para saber si se sumó o se restó, y repetir el saltito en cada suma (alterna a / b)
  const [sube, setSube] = useState(true)
  const [pulso, setPulso] = useState<'a' | 'b' | null>(null)
  if (visible && (cantidad !== mostrado.cantidad || total !== mostrado.total)) {
    const suma = cantidad > mostrado.cantidad
    setSube(suma || (cantidad === mostrado.cantidad && total > mostrado.total))
    // El saltito, solo al sumar y si ya estaba a la vista (al aparecer ya tiene su entrada)
    if (suma && mostrado.cantidad > 0) setPulso(pulso === 'a' ? 'b' : 'a')
    setMostrado({ cantidad, total })
  }

  return (
    <div
      className="barra-pedido pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-6"
      data-visible={visible}
      inert={!visible}
    >
      <button
        type="button"
        onClick={onAbrir}
        data-pulso={pulso ?? undefined}
        className="barra-pedido__boton pointer-events-auto mx-auto flex w-full max-w-180 cursor-pointer items-stretch border-2 border-pancho-black bg-white text-left text-pancho-black shadow-[6px_6px_0_var(--color-pancho-black)] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
      >
        <span className="barra-pedido__cantidad flex min-w-14 items-center justify-center overflow-hidden bg-pancho-red-deep px-4 font-heading text-[22px] text-white">
          {/* La key hace que cada valor nuevo entre con su animación */}
          <span key={mostrado.cantidad} className="cantidad__digito block" data-sube={sube}>
            {mostrado.cantidad}
          </span>
        </span>
        <span className="flex flex-1 items-center justify-between gap-3 px-5 py-3.5">
          <span className="text-[13px] font-extrabold uppercase tracking-[0.08em]">Tu pedido</span>
          <span className="overflow-hidden font-heading text-2xl leading-none text-pancho-red-deep">
            <span key={mostrado.total} className="cantidad__digito block" data-sube={sube}>
              {formatPrice(mostrado.total)}
            </span>
          </span>
        </span>
        <span className="barra-pedido__flecha flex w-14.5 items-center justify-center bg-pancho-black text-white">
          <ArrowRight className="size-5 stroke-[2.5]" />
        </span>
      </button>
    </div>
  )
}

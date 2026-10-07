'use client'

import { registrarImpresion } from '@/lib/orders/actions'

/**
 * Imprime las comandas de un pedido sin salir de la pantalla: carga la página de comandas en un
 * marco oculto y abre el diálogo de impresión ahí. (Al imprimir, esa página solo muestra los
 * tickets.) La promesa se resuelve cuando se cierra el diálogo, y suma la impresión para marcar
 * las próximas como REIMPRESIÓN.
 */
export function imprimirComandas(pedidoId: number): Promise<void> {
  return new Promise((resolver) => {
    const marco = document.createElement('iframe')
    marco.setAttribute('aria-hidden', 'true')
    marco.tabIndex = -1
    marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    marco.src = `/admin/pedidos/${pedidoId}/comandas`

    let terminado = false
    const terminar = () => {
      if (terminado) return
      terminado = true
      void registrarImpresion(pedidoId)
      // Se saca un rato después: algunos navegadores siguen usando el marco al cerrar el diálogo
      setTimeout(() => marco.remove(), 2000)
      resolver()
    }

    marco.onload = () => {
      const ventana = marco.contentWindow
      if (!ventana) return terminar()
      ventana.addEventListener('afterprint', terminar, { once: true })
      ventana.focus()
      // En Chrome y Edge print() espera hasta que se cierra el diálogo: al volver, ya terminó
      ventana.print()
      terminar()
    }

    document.body.appendChild(marco)
  })
}

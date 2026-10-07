import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  etiquetaTiempo,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  formatearSoloFecha,
} from '@/lib/orders/estados'
import { leerNombreLocal, obtenerPedido } from '@/lib/orders/queries'
import { Encabezado } from '../../../encabezado'
import { BotonImprimir } from './boton-imprimir'

// Ticket para la impresora térmica POS80C: 80 mm de ancho de papel (~72 mm imprimibles).
// Se imprime con el diálogo del navegador (window.print): la impresión automática sin diálogo
// está fuera de alcance. Cada comanda sale en su propia hoja.
const ESTILO_TICKET = `
  @page { size: 80mm auto; margin: 3mm; }
  @media print {
    html, body { background: #fff !important; }
    .comanda { width: 72mm; margin: 0; border: 0; box-shadow: none; page-break-after: always; break-after: page; }
    .comanda:last-child { page-break-after: auto; break-after: auto; }
  }
`

export default async function ComandasPage({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario()
  const { id: idCrudo } = await params
  const id = Number(idCrudo)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const datos = await obtenerPedido(id)
  if (!datos) notFound()
  const { pedido, items } = datos
  const nombreLocal = await leerNombreLocal()
  const esDelivery = pedido.modalidad === 'delivery'
  // Ya se imprimió antes: esta vez sale marcada (el contador sube después de imprimir)
  const reimpresion = pedido.comandasImpresas > 0

  const lineaDoble = <hr className="my-2 border-t-2 border-dashed border-black" />

  return (
    <section className="mx-auto max-w-3xl">
      <style>{ESTILO_TICKET}</style>

      {/* Todo esto es solo para la pantalla: al imprimir salen únicamente los dos tickets */}
      <div className="print:hidden">
        <Link href={`/admin/pedidos/${pedido.id}`} className="pn-back">
          <ArrowLeft className="size-4" />
          Volver al pedido
        </Link>
        <div className="mt-2">
          <Encabezado
            titulo="Comandas"
            rotulo={`Pedido N° ${formatearNumero(pedido.numero)}`}
            descripcion="Se imprimen dos comandas: primero la del cliente y después la de cocina. En el diálogo elegí la impresora térmica y el papel de 80 mm."
          >
            <BotonImprimir pedidoId={pedido.id} />
          </Encabezado>
          {reimpresion && (
            <p className="pn-alert pn-alert--warn mt-4">
              Ya se imprimió {pedido.comandasImpresas === 1 ? 'una vez' : `${pedido.comandasImpresas} veces`}: sale marcada como
              REIMPRESIÓN.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-start justify-center gap-8 print:mt-0 print:block">
        {/* Primera comanda: la del cliente (va con el pedido) */}
        <article className="comanda w-[72mm] bg-white p-3 font-mono text-[13px] leading-tight text-black shadow-xl">
          {reimpresion && <p className="mb-1 text-center font-bold">*** REIMPRESIÓN ***</p>}
          <p className="text-center text-lg font-bold">{nombreLocal}</p>
          <p className="text-center font-bold">¡GRACIAS POR TU COMPRA!</p>
          <p className="text-center text-xl font-bold">N° {formatearNumero(pedido.numero)}</p>
          {lineaDoble}
          <p>
            Fecha: {formatearSoloFecha(pedido.creadoEn)} {formatearHora(pedido.creadoEn)}
          </p>
          <p>
            Cliente: <strong>{pedido.clienteNombre}</strong>
          </p>
          {pedido.clienteTelefono && <p>Tel.: {pedido.clienteTelefono}</p>}
          <p className="font-bold uppercase">{ETIQUETA_MODALIDAD[pedido.modalidad]}</p>
          {esDelivery && pedido.direccion && (
            <p>
              Dirección: {pedido.direccion}
              {pedido.referencia ? ` (${pedido.referencia})` : ''}
            </p>
          )}
          {pedido.tiempoEstimadoMin && pedido.entregaEstimada && (
            <p>
              Tiempo estimado: {etiquetaTiempo(pedido.tiempoEstimadoMin)} (aprox. {formatearHora(pedido.entregaEstimada)})
            </p>
          )}
          {lineaDoble}
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <p className="flex justify-between gap-2">
                  <span>
                    {item.cantidad} x {item.nombre}
                  </span>
                  <span>{formatearPrecio(item.precioUnitario * item.cantidad)}</span>
                </p>
                {item.aclaraciones && <p className="pl-3">** {item.aclaraciones}</p>}
              </li>
            ))}
          </ul>
          {lineaDoble}
          {pedido.descuentoMonto > 0 && (
            <>
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatearPrecio(pedido.subtotal)}</span>
              </p>
              <p className="flex justify-between">
                <span>Descuento {pedido.descuentoPorcentaje}%</span>
                <span>-{formatearPrecio(pedido.descuentoMonto)}</span>
              </p>
            </>
          )}
          <p className="flex justify-between text-lg font-bold">
            <span>TOTAL</span>
            <span>{formatearPrecio(pedido.total)}</span>
          </p>
          <p>Pago: {ETIQUETA_PAGO[pedido.metodoPago]}</p>
        </article>

        {/* Segunda comanda: la de cocina */}
        <article className="comanda w-[72mm] bg-white p-3 font-mono text-[13px] leading-tight text-black shadow-xl">
          {reimpresion && <p className="mb-1 text-center font-bold">*** REIMPRESIÓN ***</p>}
          <p className="text-center text-2xl font-bold uppercase">{esDelivery ? 'DELIVERY' : 'RETIRO'}</p>
          <p className="text-center text-xl font-bold">N° {formatearNumero(pedido.numero)}</p>
          {lineaDoble}
          <p>
            Fecha: {formatearSoloFecha(pedido.creadoEn)} {formatearHora(pedido.creadoEn)}
          </p>
          <p className="text-base font-bold">{pedido.clienteNombre}</p>
          {lineaDoble}
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <p className="text-base font-bold">
                  {item.cantidad} x {item.nombre}
                </p>
                {item.aclaraciones && <p className="pl-3">** {item.aclaraciones}</p>}
              </li>
            ))}
          </ul>
          {pedido.notas && (
            <>
              {lineaDoble}
              <p>Notas: {pedido.notas}</p>
            </>
          )}
        </article>
      </div>
    </section>
  )
}

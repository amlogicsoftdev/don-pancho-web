import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirUsuario } from '@/lib/auth/guards'
import {
  ETIQUETA_MODALIDAD,
  ETIQUETA_PAGO,
  formatearHora,
  formatearNumero,
  formatearPrecio,
  formatearSoloFecha,
} from '@/lib/orders/estados'
import { leerNombreLocal, obtenerPedido } from '@/lib/orders/queries'
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

  const lineaDoble = <hr className="my-2 border-t-2 border-dashed border-black" />

  return (
    <section className="mx-auto max-w-md space-y-4">
      <style>{ESTILO_TICKET}</style>

      <div className="space-y-2 print:hidden">
        <Link href={`/admin/pedidos/${pedido.id}`} className="text-sm text-pancho-muted hover:text-pancho-cream">
          ← Volver al pedido
        </Link>
        <p className="text-sm text-pancho-muted">
          Se imprimen dos comandas: la de cocina y la del cliente. En el diálogo elegí la impresora térmica y el
          papel de 80 mm.
        </p>
        <BotonImprimir />
      </div>

      {/* Comanda de cocina */}
      <article className="comanda mx-auto w-[72mm] bg-white p-3 font-mono text-[13px] leading-tight text-black">
        <p className="text-center text-lg font-bold">COCINA</p>
        <p className="text-center text-xl font-bold">N° {formatearNumero(pedido.numero)}</p>
        {lineaDoble}
        <p>
          Hora: <strong>{formatearHora(pedido.creadoEn)}</strong>
        </p>
        <p className="text-base font-bold uppercase">{ETIQUETA_MODALIDAD[pedido.modalidad]}</p>
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

      {/* Comanda del cliente */}
      <article className="comanda mx-auto w-[72mm] bg-white p-3 font-mono text-[13px] leading-tight text-black">
        <p className="text-center text-lg font-bold">{nombreLocal}</p>
        <p className="text-center text-xl font-bold">N° {formatearNumero(pedido.numero)}</p>
        {lineaDoble}
        <p>
          Fecha: {formatearSoloFecha(pedido.creadoEn)} {formatearHora(pedido.creadoEn)}
        </p>
        <p className="font-bold uppercase">{ETIQUETA_MODALIDAD[pedido.modalidad]}</p>
        {esDelivery && pedido.direccion && (
          <p>
            Entrega: {pedido.direccion}
            {pedido.referencia ? ` (${pedido.referencia})` : ''}
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
        {lineaDoble}
        <p className="text-center">¡Gracias por tu pedido!</p>
      </article>
    </section>
  )
}

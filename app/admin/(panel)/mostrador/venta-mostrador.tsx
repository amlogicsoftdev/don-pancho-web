'use client'

import { Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { agruparVariantes, etiquetaTamano, tamanosDe, variantePara, versionConPanceta, type GrupoMenu } from '@/lib/menu/variantes'
import { registrarVentaMostrador } from '@/lib/orders/actions'
import { descuentoDeLinea, esPorcentajeValido, formatearNumero, formatearPrecio } from '@/lib/orders/estados'
import { CuadroConfirmar } from '../pedidos/cuadro-confirmar'

interface Categoria {
  id: number
  nombre: string
  productos: { id: number; nombre: string; precio: number }[]
}

/** Producto de la carta listo para agrupar sus variantes (tamaño y panceta). */
interface ProductoVenta {
  id: number
  name: string
  category: string
  precio: number
}

/** Elección de un plato con variantes: tamaño y si va con panceta. */
interface Eleccion {
  tamano?: number | null
  panceta?: boolean
}

interface Registrada {
  id: number
  numero: number
  total: number
  /** Delivery en efectivo: lo cobra el cadete y suma a la caja al marcarlo entregado. */
  cobraAlEntregar: boolean
}

// Los precios acá son solo para mostrar el total mientras se arma la venta. El servidor
// vuelve a calcular todo con los precios de la base.
export function VentaMostrador({ menu }: { menu: Categoria[] }) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [modalidad, setModalidad] = useState<'retiro' | 'delivery'>('retiro')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  // Descuento % de cada producto de la venta (por id de producto)
  const [descuentos, setDescuentos] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [registrada, setRegistrada] = useState<Registrada | null>(null)
  // Cuadro de confirmación: tiempo de entrega, impresión y aviso por WhatsApp
  const [confirmando, setConfirmando] = useState(false)
  // La venta se guardó en este cuadro: al cerrarlo se limpia el formulario para la próxima
  const [guardadaEnCuadro, setGuardadaEnCuadro] = useState(false)
  // Categoría a la vista (null = todas) y tamaño / panceta elegidos en cada plato
  const [filtro, setFiltro] = useState<number | null>(null)
  const [elecciones, setElecciones] = useState<Record<string, Eleccion>>({})
  // Alto de la barra del panel: los filtros quedan pegados justo debajo al scrollear
  const [altoBarra, setAltoBarra] = useState(0)

  useEffect(() => {
    const barra = document.querySelector<HTMLElement>('.pn-bar')
    if (!barra) return
    const medir = () => setAltoBarra(barra.offsetHeight)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(barra)
    return () => observador.disconnect()
  }, [])

  // Cada hamburguesa es un solo renglón: el tamaño y la panceta se eligen con botones, como en la carta
  const grupos = menu.map((c) => ({
    ...c,
    platos: agruparVariantes<ProductoVenta>(
      c.productos.map((p) => ({ id: p.id, name: p.nombre, category: c.nombre, precio: p.precio })),
    ),
  }))
  const aLaVista = filtro === null ? grupos : grupos.filter((c) => c.id === filtro)

  function elegir(grupo: GrupoMenu<ProductoVenta>, cambio: Eleccion) {
    setElecciones((actual) => ({ ...actual, [grupo.clave]: { ...actual[grupo.clave], ...cambio } }))
  }

  const productos = menu.flatMap((c) => c.productos)
  const lineas = productos.filter((p) => (cantidades[p.id] ?? 0) > 0)
  const subtotal = lineas.reduce((suma, p) => suma + p.precio * cantidades[p.id], 0)
  // Mismo cálculo que el servidor (lib/orders/create.ts); el que vale es el del servidor
  const porcentajeDe = (id: number) => Number(descuentos[id]) || 0
  const porcentajeValido = (id: number) => esPorcentajeValido(porcentajeDe(id))
  const descuentosValidos = lineas.every((p) => porcentajeValido(p.id))
  const descuentoMonto = lineas.reduce(
    (suma, p) => suma + (porcentajeValido(p.id) ? descuentoDeLinea(p.precio, cantidades[p.id], porcentajeDe(p.id)) : 0),
    0,
  )
  const total = subtotal - descuentoMonto

  function cambiar(id: number, delta: number) {
    setCantidades((actual) => {
      const nueva = Math.max(0, Math.min(50, (actual[id] ?? 0) + delta))
      return { ...actual, [id]: nueva }
    })
  }

  function limpiar() {
    setCantidades({})
    setNombre('')
    setTelefono('')
    setDireccion('')
    setDescuentos({})
    setMetodoPago('efectivo')
    setModalidad('retiro')
    setError(null)
  }

  /** Revisa lo básico antes de abrir el cuadro (el servidor vuelve a validar todo). */
  function abrirConfirmacion() {
    setError(null)
    if (!descuentosValidos) return setError('El descuento debe ser un número entero entre 0 y 100.')
    if (modalidad === 'delivery' && !direccion.trim()) return setError('Para delivery, cargá la dirección de entrega.')
    setConfirmando(true)
  }

  async function registrar(minutos: number) {
    const resultado = await registrarVentaMostrador(
      {
        metodoPago,
        modalidad,
        clienteNombre: nombre,
        clienteTelefono: telefono,
        direccion: modalidad === 'delivery' ? direccion : null,
        items: lineas.map((p) => ({
          productoId: p.id,
          cantidad: cantidades[p.id],
          descuentoPorcentaje: porcentajeDe(p.id),
        })),
        tiempoEstimadoMin: minutos,
      },
      true,
    )
    if (!resultado.ok) return resultado
    setRegistrada({
      id: resultado.id,
      numero: resultado.numero,
      total: resultado.total,
      cobraAlEntregar: modalidad === 'delivery' && metodoPago === 'efectivo',
    })
    setGuardadaEnCuadro(true)
    return { ok: true as const, pedidoId: resultado.id, numero: resultado.numero, linkWhatsApp: resultado.linkWhatsApp }
  }

  function cerrarConfirmacion() {
    setConfirmando(false)
    if (guardadaEnCuadro) {
      setGuardadaEnCuadro(false)
      limpiar()
    }
  }

  return (
    <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* La carta: se suma o se quita con los botones de cada renglón */}
      <div className="space-y-6">
        {menu.length === 0 && <p className="pn-card pn-muted p-6 font-semibold">No hay productos activos en el menú.</p>}

        {/* Filtros por categoría, pegados debajo de la barra: así no hay que recorrer toda la carta */}
        {menu.length > 1 && (
          <nav
            aria-label="Filtrar por categoría"
            style={{ top: altoBarra }}
            className="sticky z-10 -mx-1 flex gap-2 overflow-x-auto bg-[rgb(255_238_214/0.94)] px-1 py-2 backdrop-blur-md"
          >
            {[{ id: null, nombre: 'Todas' }, ...menu].map((c) => (
              <button
                key={c.id ?? 'todas'}
                type="button"
                onClick={() => setFiltro(c.id)}
                aria-pressed={filtro === c.id}
                className="pn-option flex-none"
              >
                {c.nombre}
              </button>
            ))}
          </nav>
        )}

        {aLaVista.map((categoria) => (
          <div key={categoria.id} className="pn-card p-5 sm:p-6">
            <h2 className="text-2xl leading-none">{categoria.nombre}</h2>
            <ul className="pn-rows mt-3">
              {categoria.platos.map((grupo) => {
                const eleccion = elecciones[grupo.clave] ?? {}
                const actual = variantePara(grupo, eleccion.tamano, eleccion.panceta ?? false)
                const p = actual.product
                const tamanos = tamanosDe(grupo)
                const panceta = versionConPanceta(grupo, actual.tamano)
                const cantidad = cantidades[p.id] ?? 0
                // Lo que ya hay en la venta de este plato, sumando todas sus variantes
                const delPlato = grupo.variantes.reduce((suma, v) => suma + (cantidades[v.product.id] ?? 0), 0)
                return (
                  <li key={grupo.clave} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base leading-snug font-bold">
                        {grupo.variantes.length > 1 ? grupo.nombre : p.name}
                      </p>
                      <p className="pn-muted text-sm font-semibold tabular-nums">
                        {formatearPrecio(p.precio)}
                        {delPlato > cantidad && ` · ${delPlato} en la venta`}
                      </p>
                    </div>
                    <div className="flex flex-none items-center gap-1.5">
                      <Button size="icon" onClick={() => cambiar(p.id, -1)} disabled={cantidad === 0} aria-label={`Quitar ${p.name}`}>
                        <Minus strokeWidth={3} />
                      </Button>
                      <span
                        className={`grid h-11 w-10 place-items-center font-heading text-2xl leading-none tabular-nums ${cantidad > 0 ? 'bg-pancho-black text-white' : ''}`}
                      >
                        {cantidad}
                      </span>
                      <Button size="icon" onClick={() => cambiar(p.id, 1)} aria-label={`Agregar ${p.name}`}>
                        <Plus strokeWidth={3} />
                      </Button>
                    </div>
                    {(tamanos.length > 1 || panceta) && (
                      <div className="flex w-full flex-wrap items-center gap-2">
                        {tamanos.length > 1 && (
                          <div role="group" aria-label={`Tamaño de ${grupo.nombre}`} className="pn-segmento">
                            {tamanos.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => elegir(grupo, { tamano: t })}
                                aria-pressed={actual.tamano === t}
                                className="pn-option"
                              >
                                {etiquetaTamano(t)}
                              </button>
                            ))}
                          </div>
                        )}
                        {panceta && (
                          <div className="pn-segmento">
                            <button
                              type="button"
                              onClick={() => elegir(grupo, { tamano: actual.tamano, panceta: !actual.conPanceta })}
                              aria-pressed={actual.conPanceta}
                              className="pn-option"
                            >
                              Con panceta
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* La venta: queda a la vista mientras se recorre la carta */}
      <aside className="pn-card space-y-5 p-5 lg:sticky lg:top-20">
        <h2 className="text-2xl leading-none">Venta</h2>

        {registrada && (
          <div role="status" className="pn-alert pn-alert--ok">
            <p>
              Venta N° {formatearNumero(registrada.numero)} registrada por {formatearPrecio(registrada.total)}. Quedó en
              preparación.
              {registrada.cobraAlEntregar && ' El efectivo suma a la caja cuando lo marques como entregado.'}
            </p>
            <Link href={`/admin/pedidos/${registrada.id}`} className="pn-link mt-1 inline-flex">
              Ver el pedido
            </Link>
          </div>
        )}

        {lineas.length === 0 ? (
          <p className="pn-muted text-sm font-semibold">Todavía no agregaste productos.</p>
        ) : (
          <ul className="space-y-3 text-sm font-semibold tabular-nums">
            {lineas.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between gap-3">
                  <span>
                    <strong className="font-extrabold">{cantidades[p.id]}x</strong> {p.nombre}
                  </span>
                  <span>{formatearPrecio(p.precio * cantidades[p.id])}</span>
                </div>
                <label className="mt-1 flex items-center justify-between gap-3">
                  <span className="pn-muted text-xs">Descuento %</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    step={1}
                    value={descuentos[p.id] ?? ''}
                    onChange={(e) => setDescuentos((actual) => ({ ...actual, [p.id]: e.target.value }))}
                    placeholder="0"
                    aria-label={`Descuento % de ${p.nombre}`}
                    className="pn-field w-20"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}

        {descuentoMonto > 0 && (
          <dl className="space-y-1 border-t border-pancho-black/10 pt-3 text-sm font-semibold tabular-nums">
            <div className="flex justify-between gap-3">
              <dt className="pn-muted">Subtotal</dt>
              <dd>{formatearPrecio(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="pn-muted">Descuento</dt>
              <dd>-{formatearPrecio(descuentoMonto)}</dd>
            </div>
          </dl>
        )}

        <div className="flex items-baseline justify-between border-t border-pancho-black/30 pt-3">
          <span className="font-display text-2xl leading-none">Total</span>
          <span className="font-display text-4xl leading-none tabular-nums">{formatearPrecio(total)}</span>
        </div>

        <fieldset>
          <legend className="pn-label">Método de pago</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['efectivo', 'transferencia'] as const).map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                aria-pressed={metodoPago === metodo}
                className="pn-option"
              >
                {metodo}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="pn-label">Entrega</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['retiro', 'delivery'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setModalidad(opcion)}
                aria-pressed={modalidad === opcion}
                className="pn-option"
              >
                {opcion === 'retiro' ? 'Retira' : 'Delivery'}
              </button>
            ))}
          </div>
        </fieldset>

        {modalidad === 'delivery' && (
          <label className="block">
            <span className="pn-label">Dirección de entrega</span>
            <input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              maxLength={200}
              required
              placeholder="Calle, número, depto o referencia"
              className="pn-field"
            />
          </label>
        )}

        <label className="block">
          <span className="pn-label">Nombre y apellido (opcional)</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} className="pn-field" />
        </label>

        <label className="block">
          <span className="pn-label">Teléfono (opcional, para avisarle por WhatsApp)</span>
          <input
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            maxLength={30}
            placeholder="Ej.: 3442 66-8413"
            className="pn-field"
          />
        </label>

        {error && (
          <p role="alert" className="pn-alert pn-alert--error">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Button variant="default" size="lg" className="w-full" disabled={lineas.length === 0} onClick={abrirConfirmacion}>
            Registrar venta
          </Button>
          {lineas.length > 0 && (
            <Button variant="ghost" className="w-full" onClick={limpiar}>
              Vaciar
            </Button>
          )}
        </div>
      </aside>

      <CuadroConfirmar
        abierto={confirmando}
        titulo="Registrar venta"
        textoConfirmar="Registrar venta"
        onConfirmar={registrar}
        onCerrar={cerrarConfirmacion}
      />
    </div>
  )
}

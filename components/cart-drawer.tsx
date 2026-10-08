'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Banknote,
  CreditCard,
  Bike,
  Store,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  MessageSquarePlus,
} from 'lucide-react'
import { CartItem } from '@/lib/types'
import { NOTE_MAX_LENGTH } from '@/lib/cart'
import { formatPrice, SITE_CONFIG } from '@/lib/data'
import { PanchoButton } from './pancho-button'

interface CartDrawerProps {
  items: CartItem[]
  isOpen: boolean
  onClose: () => void
  onUpdateQuantity: (id: number, delta: number) => void
  onRemoveItem: (id: number) => void
  /** Guarda la aclaración de un producto (sin cebolla, sin aderezo…). */
  onUpdateNote: (id: number, note: string) => void
  onOrderCreated: () => void
  /** Productos que estaban en el carrito y ya no están en el menú. */
  unavailableCount?: number
}

const inputClass =
  'w-full border-2 border-pancho-black bg-white py-2.5 text-base text-pancho-black outline-none transition-shadow placeholder:text-pancho-black/45 focus:ring-2 focus:ring-pancho-orange sm:text-sm'

const invalidClass = 'border-pancho-red-deep ring-2 ring-pancho-red-deep/40'

const labelClass = 'about-label'

/**
 * Carrito lateral, en papel crema como el resto del sitio: el detalle del pedido (con una
 * aclaración opcional por producto), los datos del cliente, la entrega, el pago y el total.
 */
export function CartDrawer({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNote,
  onOrderCreated,
  unavailableCount = 0,
}: CartDrawerProps) {
  const router = useRouter()
  const [orderType, setOrderType] = useState<'delivery' | 'retiro'>('delivery')
  const [address, setAddress] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [website, setWebsite] = useState('') // anti-bots: las personas no lo ven ni lo completan
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Campo que falta completar: se marca en rojo y se lleva el cursor hasta él
  const [invalidField, setInvalidField] = useState<'nombre' | 'telefono' | 'direccion' | null>(null)
  const [fallbackAvailable, setFallbackAvailable] = useState(false)
  const [confirmation, setConfirmation] = useState<{ numero: number; total: number; token: string } | null>(null)
  // Productos cuyo campo de aclaración está abierto (los que ya tienen una siempre lo muestran)
  const [openNotes, setOpenNotes] = useState<number[]>([])
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem('donpancho_address')
      // Se lee recién al montar para que el HTML del servidor coincida con el del navegador.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedAddress) setAddress(savedAddress)
    } catch {}
  }, [])

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const handleAddressChange = (val: string) => {
    setAddress(val)
    try {
      localStorage.setItem('donpancho_address', val)
    } catch {}
  }

  const handleAddMore = () => {
    onClose()
    router.push('/menu')
  }

  const openNote = (id: number) => setOpenNotes((current) => (current.includes(id) ? current : [...current, id]))

  // Respaldo: si no se pudo guardar el pedido, se manda por WhatsApp al local para no perder la venta.
  const openWhatsAppFallback = () => {
    const itemLines = items
      .map((item) => {
        const line = `🍔 ${item.quantity}x ${item.name} (${formatPrice(item.price * item.quantity)})`
        return item.note?.trim() ? `${line}\n   ✏️ ${item.note.trim()}` : line
      })
      .join('\n')

    const deliveryLines =
      orderType === 'delivery'
        ? `🛵 Entrega: Delivery\n📍 Mi dirección: ${address.trim() || 'A coordinar por chat'}`
        : '🏪 Entrega: Para retirar por el local'

    const paymentLabel = paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'
    const message = `¡Hola ${SITE_CONFIG.name}! 🍔 Quiero hacer el siguiente pedido:\n\n${itemLines}\n\n💰 Total: ${formatPrice(totalAmount)}\n💳 Método de pago: ${paymentLabel}\n${deliveryLines}\n👤 Nombre: ${customerName.trim()}\n📞 Teléfono: ${customerPhone.trim()}\n\n¡Muchas gracias!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  const clearFieldError = () => {
    setInvalidField(null)
    setError(null)
  }

  const handleSubmitOrder = async () => {
    if (items.length === 0 || isSending) return
    setError(null)
    setInvalidField(null)
    setFallbackAvailable(false)

    // El campo vive más abajo en la lista, detrás del pie del carrito: se lo muestra y se deja
    // listo para escribir, así no hace falta buscarlo ni recargar la página.
    const rechazar = (message: string, field: 'nombre' | 'telefono' | 'direccion', input: HTMLInputElement | null) => {
      setError(message)
      setInvalidField(field)
      input?.focus({ preventScroll: true })
      input?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    if (!customerName.trim()) return rechazar('Ingresá tu nombre y apellido.', 'nombre', nameRef.current)
    if (!customerPhone.trim()) {
      return rechazar('Ingresá tu teléfono para poder confirmarte el pedido.', 'telefono', phoneRef.current)
    }
    if (orderType === 'delivery' && !address.trim()) {
      return rechazar('Ingresá la dirección de entrega.', 'direccion', inputRef.current)
    }

    setIsSending(true)
    try {
      // Se mandan ids, cantidades y aclaraciones: el servidor calcula los precios y el total.
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modalidad: orderType,
          metodoPago: paymentMethod,
          clienteNombre: customerName,
          clienteTelefono: customerPhone,
          direccion: orderType === 'delivery' ? address : null,
          website,
          items: items.map((item) => ({
            productoId: item.id,
            cantidad: item.quantity,
            aclaraciones: item.note?.trim() || null,
          })),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setConfirmation({ numero: data.numero, total: data.total, token: data.token })
        onOrderCreated()
        return
      }
      setError(data.error ?? 'No pudimos guardar tu pedido.')
      setFallbackAvailable(response.status >= 500)
    } catch {
      setError('No pudimos conectarnos. Revisá tu conexión.')
      setFallbackAvailable(true)
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseConfirmation = () => {
    setConfirmation(null)
    onClose()
  }

  /** Dos opciones en un solo bloque con borde negro; la elegida va en bordó */
  const segmentClass = (active: boolean, second: boolean) =>
    `flex cursor-pointer select-none items-center justify-center gap-2 px-3 py-2.5 text-xs font-extrabold uppercase tracking-[0.04em] transition-colors duration-200 sm:text-sm ${
      second ? 'border-l-2 border-pancho-black' : ''
    } ${active ? 'bg-pancho-red-deep text-white' : 'bg-white text-pancho-black/65 hover:text-pancho-black'}`

  return (
    <>
      {/* Telón de fondo (overlay) */}
      <div
        className={`fixed inset-0 z-60 bg-pancho-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral del carrito */}
      <aside
        aria-label="Tu pedido"
        className={`cart-panel fixed top-0 right-0 z-60 flex h-full w-full max-w-md transform-gpu flex-col border-l border-pancho-black/20 bg-pancho-paper bg-[url('/images/fondo-secciones-crema.webp')] bg-cover bg-top text-pancho-black shadow-2xl transition-transform duration-400 ease-(--ease-drawer) will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Cabecera del carrito */}
        <div className="flex items-start justify-between border-b border-pancho-black/20 p-5 sm:p-6">
          <div>
            <span className="inline-block -rotate-3 bg-pancho-red px-2 py-1 font-sans text-xs font-extrabold uppercase leading-none tracking-[0.04em] text-white shadow-[3px_3px_0_var(--color-pancho-black)]">
              Tu carrito
            </span>
            <h2 className="mt-3 flex items-center gap-3 text-5xl leading-[0.9]">
              Tu pedido
              {totalCount > 0 && (
                <span className="flex min-w-9 items-center justify-center bg-pancho-black px-2 py-1 font-heading text-xl leading-none text-pancho-orange">
                  {totalCount}
                </span>
              )}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center border-2 border-pancho-black bg-white text-pancho-black transition-colors hover:bg-pancho-black hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Contenido del carrito */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!confirmation && unavailableCount > 0 && (
            <p
              role="status"
              className="mb-4 border-2 border-pancho-black bg-pancho-orange/25 p-3 text-sm font-medium text-pancho-black"
            >
              {unavailableCount === 1
                ? 'Un producto de tu pedido ya no está disponible y lo sacamos.'
                : `${unavailableCount} productos de tu pedido ya no están disponibles y los sacamos.`}
            </p>
          )}
          {confirmation ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="mb-4 size-16 text-pancho-red-deep" />
              <h3 className="mb-2 text-4xl leading-[0.95]">¡Recibimos tu pedido!</h3>
              <p className="mb-1 font-medium">
                Pedido{' '}
                <span className="font-extrabold text-pancho-red-deep">
                  N° {String(confirmation.numero).padStart(4, '0')}
                </span>
              </p>
              <p className="mb-6 text-sm text-pancho-black/70">Total: {formatPrice(confirmation.total)}</p>
              <p className="mb-6 max-w-xs text-sm font-medium text-pancho-black/75">
                El local te lo va a confirmar por WhatsApp al número que nos dejaste. Desde el link de
                seguimiento ves cómo avanza.
              </p>
              <div className="flex w-full max-w-xs flex-col gap-3">
                <PanchoButton href={`/pedido/${confirmation.token}`} block>
                  Seguir mi pedido
                </PanchoButton>
                <button
                  type="button"
                  onClick={handleCloseConfirmation}
                  className="min-h-11 cursor-pointer text-sm font-extrabold uppercase tracking-[0.04em] text-pancho-black/70 hover:text-pancho-black"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="animate-float mb-5 flex size-20 items-center justify-center border-2 border-pancho-black bg-white shadow-[5px_5px_0_var(--color-pancho-black)]">
                <ShoppingCart className="size-10 text-pancho-red-deep" />
              </div>
              <h3 className="mb-2 text-3xl leading-[0.95]">Tu carrito está vacío</h3>
              <p className="mb-6 max-w-xs text-sm font-medium text-pancho-black/70">
                Elegí tus burgers favoritas del menú y armá tu pedido en unos pocos clics.
              </p>
              <PanchoButton onClick={handleAddMore} block className="max-w-xs">
                Ver el menú
              </PanchoButton>
            </div>
          ) : (
            <div>
              {/* Detalle del pedido */}
              <div className="mb-3 flex items-center gap-3">
                <span className={`${labelClass} shrink-0`}>Detalle del pedido</span>
                <div className="flex-1 border-b border-pancho-black/20" />
              </div>

              <div className="mb-8 divide-y divide-pancho-black/20">
                {items.map((item) => {
                  const noteVisible = Boolean(item.note) || openNotes.includes(item.id)
                  return (
                    <div key={item.id} className="py-4 first:pt-1 last:pb-1">
                      {/* Nombre ············ subtotal, como una comanda */}
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="truncate font-heading text-xl">{item.name}</h4>
                        <div className="mx-2 mb-1 flex-1 self-baseline border-b-2 border-dotted border-pancho-black/35" />
                        <span className="shrink-0 font-heading text-xl text-pancho-red-deep">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Precio unitario y controles */}
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-pancho-black/70">
                          <span>{formatPrice(item.price)}</span>
                          <span className="text-pancho-black/50">c/u</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="flex items-stretch border-2 border-pancho-black bg-white">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="flex size-7 cursor-pointer items-center justify-center transition-colors hover:bg-pancho-orange"
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <Minus className="size-3.5 stroke-3" />
                            </button>
                            <span className="flex min-w-7 items-center justify-center border-x-2 border-pancho-black bg-pancho-black px-1 font-heading text-sm text-pancho-orange">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="flex size-7 cursor-pointer items-center justify-center transition-colors hover:bg-pancho-orange"
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              <Plus className="size-3.5 stroke-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="cursor-pointer p-1.5 text-pancho-black/55 transition-colors hover:text-pancho-red-deep"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Aclaración: sin cebolla, sin aderezo, punto de la carne… */}
                      {noteVisible ? (
                        <div className="mt-3">
                          <label htmlFor={`nota-${item.id}`} className="sr-only">
                            Aclaración para {item.name}
                          </label>
                          <input
                            id={`nota-${item.id}`}
                            type="text"
                            value={item.note ?? ''}
                            maxLength={NOTE_MAX_LENGTH}
                            autoFocus={!item.note}
                            onChange={(e) => onUpdateNote(item.id, e.target.value)}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            placeholder="Ej: sin cebolla, sin aderezo…"
                            className={`${inputClass} px-3 py-2 text-sm sm:text-xs`}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openNote(item.id)}
                          className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-pancho-red-deep underline-offset-4 hover:underline"
                        >
                          <MessageSquarePlus className="size-4" />
                          Agregar aclaración
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Datos, entrega y pago */}
              <div className="space-y-5 border-2 border-pancho-black bg-white/70 p-4 shadow-[5px_5px_0_var(--color-pancho-black)]">
                {/* Datos del cliente: el local los usa para confirmarle el pedido */}
                <div className="space-y-2.5">
                  <span className={`${labelClass} block`}>Tus datos</span>
                  <div className="relative flex items-center">
                    <User className="pointer-events-none absolute left-3 size-4 text-pancho-black/55" />
                    <input
                      type="text"
                      ref={nameRef}
                      aria-label="Tu nombre y apellido"
                      aria-invalid={invalidField === 'nombre'}
                      autoComplete="name"
                      maxLength={80}
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value)
                        if (invalidField === 'nombre') clearFieldError()
                      }}
                      placeholder="Tu nombre y apellido"
                      className={`${inputClass} pl-9 pr-3 ${invalidField === 'nombre' ? invalidClass : ''}`}
                    />
                  </div>
                  <div className="relative flex items-center">
                    <Phone className="pointer-events-none absolute left-3 size-4 text-pancho-black/55" />
                    <input
                      type="tel"
                      ref={phoneRef}
                      aria-label="Tu teléfono"
                      aria-invalid={invalidField === 'telefono'}
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={30}
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value)
                        if (invalidField === 'telefono') clearFieldError()
                      }}
                      placeholder="Tu teléfono (para confirmarte el pedido)"
                      className={`${inputClass} pl-9 pr-3 ${invalidField === 'telefono' ? invalidClass : ''}`}
                    />
                  </div>
                  {/* Campo trampa anti-bots: oculto para las personas */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />
                </div>

                {/* Tipo de entrega */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={labelClass}>Forma de entrega</span>
                    <span className="text-[11px] font-semibold text-pancho-black/60">
                      {orderType === 'delivery' ? 'A tu puerta' : 'Retiro en el local'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 border-2 border-pancho-black">
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={segmentClass(orderType === 'delivery', false)}
                    >
                      <Bike className="size-4" />
                      <span>Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('retiro')}
                      className={segmentClass(orderType === 'retiro', true)}
                    >
                      <Store className="size-4" />
                      <span>Para retirar</span>
                    </button>
                  </div>

                  {/* Dirección, solo para delivery */}
                  {orderType === 'delivery' && (
                    <div className="mt-2.5 animate-fadeIn">
                      <label htmlFor="delivery-address" className="sr-only">
                        Dirección de entrega
                      </label>
                      <div className="relative flex items-center">
                        <MapPin className="pointer-events-none absolute left-3 size-4 text-pancho-black/55" />
                        <input
                          ref={inputRef}
                          id="delivery-address"
                          type="text"
                          value={address}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsInputFocused(false)
                            }, 120)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              inputRef.current?.blur()
                            }
                          }}
                          aria-invalid={invalidField === 'direccion'}
                          onChange={(e) => {
                            handleAddressChange(e.target.value)
                            if (invalidField === 'direccion') clearFieldError()
                          }}
                          placeholder="Calle, número, depto o referencia..."
                          className={`${inputClass} pl-9 pr-16 ${invalidField === 'direccion' ? invalidClass : ''}`}
                        />
                        {isInputFocused && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onTouchStart={(e) => e.preventDefault()}
                            onClick={() => inputRef.current?.blur()}
                            className="absolute right-2 cursor-pointer select-none bg-pancho-orange px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.04em] text-pancho-black transition-transform active:scale-95 sm:hidden"
                          >
                            Listo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Método de pago */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={labelClass}>Método de pago</span>
                    <span className="text-[11px] font-semibold text-pancho-black/60">
                      {paymentMethod === 'efectivo' ? 'Abonás al recibir' : 'Transferís al confirmar'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 border-2 border-pancho-black">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo')}
                      className={segmentClass(paymentMethod === 'efectivo', false)}
                    >
                      <Banknote className="size-4" />
                      <span>Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia')}
                      className={segmentClass(paymentMethod === 'transferencia', true)}
                    >
                      <CreditCard className="size-4" />
                      <span>Transferencia</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del carrito */}
        {items.length > 0 && !confirmation && (
          <div
            className={`space-y-4 border-t border-pancho-black/20 bg-pancho-paper/95 p-5 backdrop-blur-sm sm:p-6 ${
              isInputFocused ? 'hidden sm:block' : 'block'
            }`}
          >
            <div className="flex items-end justify-between">
              <span className={labelClass}>Total</span>
              <span className="font-heading text-4xl leading-none text-pancho-red-deep">
                {formatPrice(totalAmount)}
              </span>
            </div>

            <p className="text-[11px] font-medium leading-normal text-pancho-black/60">
              El costo de envío y horario de entrega se confirman por WhatsApp.
            </p>

            {error && (
              <div
                role="alert"
                className="border-2 border-pancho-red-deep bg-white p-3 text-sm font-medium text-pancho-red-deep"
              >
                <p>{error}</p>
                {fallbackAvailable && (
                  <button
                    type="button"
                    onClick={openWhatsAppFallback}
                    className="mt-2 cursor-pointer font-extrabold underline underline-offset-2"
                  >
                    Enviar el pedido por WhatsApp
                  </button>
                )}
              </div>
            )}

            <PanchoButton onClick={handleSubmitOrder} disabled={isSending} block>
              {isSending ? 'Enviando…' : 'Confirmar pedido'}
            </PanchoButton>

            {/* Botón secundario: agregar más productos */}
            <button
              onClick={handleAddMore}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border-2 border-pancho-black bg-transparent px-4 py-3 font-sans text-sm font-extrabold uppercase tracking-[0.04em] text-pancho-black transition-[transform,color,background-color] duration-200 ease-out hover:bg-pancho-black hover:text-white active:scale-[0.97]"
            >
              <Plus className="size-4" />
              <span>Agregar más productos</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

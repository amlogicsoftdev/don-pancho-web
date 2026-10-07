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
} from 'lucide-react'
import { CartItem } from '@/lib/types'
import { formatPrice, SITE_CONFIG } from '@/lib/data'
import { PanchoButton } from './pancho-button'

interface CartDrawerProps {
  items: CartItem[]
  isOpen: boolean
  onClose: () => void
  onUpdateQuantity: (id: number, delta: number) => void
  onRemoveItem: (id: number) => void
  onOrderCreated: () => void
  /** Productos que estaban en el carrito y ya no están en el menú. */
  unavailableCount?: number
}

export function CartDrawer({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOrderCreated,
  unavailableCount = 0,
}: CartDrawerProps) {
  const router = useRouter()
  const [orderType, setOrderType] = useState<'delivery' | 'retiro'>('delivery')
  const [address, setAddress] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [website, setWebsite] = useState('') // anti-bots: las personas no lo ven ni lo completan
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackAvailable, setFallbackAvailable] = useState(false)
  const [confirmation, setConfirmation] = useState<{ numero: number; total: number; token: string } | null>(null)
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

  // Respaldo: si no se pudo guardar el pedido, se manda por WhatsApp al local para no perder la venta.
  const openWhatsAppFallback = () => {
    const itemLines = items
      .map((item) => `🍔 ${item.quantity}x ${item.name} (${formatPrice(item.price * item.quantity)})`)
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

  const handleSubmitOrder = async () => {
    if (items.length === 0 || isSending) return
    setError(null)
    setFallbackAvailable(false)

    if (!customerName.trim()) return setError('Ingresá tu nombre.')
    if (!customerPhone.trim()) return setError('Ingresá tu teléfono para poder confirmarte el pedido.')
    if (orderType === 'delivery' && !address.trim()) return setError('Ingresá la dirección de entrega.')

    setIsSending(true)
    try {
      // Solo se mandan ids y cantidades: el servidor calcula los precios y el total.
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
          items: items.map((item) => ({ productoId: item.id, cantidad: item.quantity })),
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

  return (
    <>
      {/* Telón de fondo (overlay) */}
      <div
        className={`fixed inset-0 z-60 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral del carrito */}
      <aside
        aria-label="Tu pedido"
        className={`fixed top-0 right-0 z-60 h-full w-full max-w-md bg-[#161616] border-l border-neutral-800 flex flex-col shadow-2xl transition-transform duration-400 ease-(--ease-drawer) transform-gpu will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Cabecera del carrito */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-3xl font-heading text-white flex items-center gap-2">
              Tu pedido <span className="text-neutral-400 font-sans text-base font-normal normal-case tracking-normal">({totalCount})</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del carrito */}
        <div className="flex-1 overflow-y-auto p-6">
          {!confirmation && unavailableCount > 0 && (
            <p role="status" className="mb-4 rounded-xl border border-pancho-orange/40 bg-pancho-orange/10 p-3 text-sm text-pancho-cream">
              {unavailableCount === 1
                ? 'Un producto de tu pedido ya no está disponible y lo sacamos.'
                : `${unavailableCount} productos de tu pedido ya no están disponibles y los sacamos.`}
            </p>
          )}
          {confirmation ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <CheckCircle2 className="w-16 h-16 text-pancho-orange mb-4" />
              <h3 className="font-heading text-3xl text-white mb-2">¡Recibimos tu pedido!</h3>
              <p className="text-neutral-300 mb-1">
                Pedido <span className="font-bold text-pancho-orange">N° {String(confirmation.numero).padStart(4, '0')}</span>
              </p>
              <p className="text-neutral-400 text-sm mb-6">Total: {formatPrice(confirmation.total)}</p>
              <p className="text-neutral-400 text-sm max-w-xs mb-6">
                El local te lo va a confirmar por WhatsApp al número que nos dejaste. Desde el link de
                seguimiento ves cómo avanza.
              </p>
              <div className="flex w-full max-w-xs flex-col gap-3">
                <PanchoButton href={`/pedido/${confirmation.token}`} variant="orange" block>
                  Seguir mi pedido
                </PanchoButton>
                <button
                  type="button"
                  onClick={handleCloseConfirmation}
                  className="min-h-11 text-sm font-bold uppercase tracking-[0.04em] text-neutral-400 hover:text-white cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-20 h-20 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400 mb-4 animate-float">
                <ShoppingCart className="w-10 h-10 text-pancho-orange" />
              </div>
              <h3 className="font-heading text-2xl text-white mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-neutral-400 text-sm max-w-xs mb-6">
                Elegí tus burgers favoritas del menú y armá tu pedido en unos pocos clics.
              </p>
              <PanchoButton onClick={handleAddMore} variant="orange" block className="max-w-xs">
                Ver el menú
              </PanchoButton>
            </div>
          ) : (
            <div>
              {/* Contenedor de opciones de entrega y pago */}
              <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4 space-y-4 mb-6">
                {/* Datos del cliente: el local los usa para confirmarle el pedido */}
                <div className="space-y-2.5">
                  <span className="block px-1 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans">
                    Tus datos
                  </span>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      aria-label="Tu nombre"
                      autoComplete="name"
                      maxLength={80}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-pancho-orange/70 focus:ring-1 focus:ring-pancho-orange/50 rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                    <input
                      type="tel"
                      aria-label="Tu teléfono"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={30}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Tu teléfono (para confirmarte el pedido)"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-pancho-orange/70 focus:ring-1 focus:ring-pancho-orange/50 rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
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

                {/* Selector Tipo de entrega */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans">
                      Forma de entrega
                    </span>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {orderType === 'delivery' ? 'A tu puerta' : 'Retiro en el local'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                        orderType === 'delivery'
                          ? 'bg-pancho-orange text-pancho-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span>Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('retiro')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                        orderType === 'retiro'
                          ? 'bg-pancho-orange text-pancho-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Para retirar</span>
                    </button>
                  </div>

                  {/* Input de dirección condicional para Delivery */}
                  {orderType === 'delivery' && (
                    <div className="mt-2.5 animate-fadeIn">
                      <label htmlFor="delivery-address" className="sr-only">
                        Dirección de entrega
                      </label>
                      <div className="relative flex items-center">
                        <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
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
                          onChange={(e) => handleAddressChange(e.target.value)}
                          placeholder="Calle, número, depto o referencia..."
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-pancho-orange/70 focus:ring-1 focus:ring-pancho-orange/50 rounded-xl pl-9 pr-16 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
                        />
                        {isInputFocused && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onTouchStart={(e) => e.preventDefault()}
                            onClick={() => inputRef.current?.blur()}
                            className="absolute right-2 px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.04em] bg-pancho-orange text-pancho-black rounded-lg sm:hidden cursor-pointer active:scale-95 transition-transform select-none"
                          >
                            Listo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Barra de opciones de Método de Pago */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans">
                      Método de pago
                    </span>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {paymentMethod === 'efectivo' ? 'Abonás al recibir' : 'Transferís al confirmar'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                        paymentMethod === 'efectivo'
                          ? 'bg-pancho-orange text-pancho-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                        paymentMethod === 'transferencia'
                          ? 'bg-pancho-orange text-pancho-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Transferencia</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Encabezado y divisor de la sección de productos */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 font-sans shrink-0">
                  Detalle del pedido
                </span>
                <div className="flex-1 border-b border-neutral-800" />
              </div>

              {/* Lista de productos */}
              <div className="divide-y divide-neutral-800/70">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 group transition-colors"
                >
                  {/* Fila principal estilo comanda de restaurante: Nombre ············ Subtotal */}
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-heading text-lg sm:text-xl text-white truncate">
                      {item.name}
                    </h4>

                    {/* Línea punteada tradicional igual que en el menú */}
                    <div className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-neutral-800 self-baseline mb-1 group-hover:border-neutral-700 transition-colors" />

                    <span className="font-heading text-lg sm:text-xl text-pancho-orange shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Fila secundaria: Precio unitario y Controles */}
                  <div className="flex items-center justify-between mt-2.5 text-xs text-neutral-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-neutral-300">{formatPrice(item.price)}</span>
                      <span className="text-neutral-500">c/u</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-2.5 py-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white min-w-4 text-center font-sans">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-neutral-500 hover:text-pancho-red p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Pie del carrito */}
        {items.length > 0 && (
          <div
            className={`p-6 border-t border-neutral-800 bg-neutral-900/60 space-y-4 ${
              isInputFocused ? 'hidden sm:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">Total</span>
              <span className="font-heading text-3xl text-pancho-orange">
                {formatPrice(totalAmount)}
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 leading-normal">
              El costo de envío y horario de entrega se confirman por WhatsApp.
            </p>

            {error && (
              <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
                <p>{error}</p>
                {fallbackAvailable && (
                  <button
                    type="button"
                    onClick={openWhatsAppFallback}
                    className="mt-2 font-bold text-pancho-orange underline underline-offset-2 cursor-pointer"
                  >
                    Enviar el pedido por WhatsApp
                  </button>
                )}
              </div>
            )}

            <PanchoButton onClick={handleSubmitOrder} disabled={isSending} variant="orange" block>
              {isSending ? 'Enviando…' : 'Confirmar pedido'}
            </PanchoButton>

            {/* Botón secundario: Agregar más productos */}
            <button
              onClick={handleAddMore}
              className="w-full flex items-center justify-center gap-2 min-h-11 py-3 px-4 rounded-xs border border-neutral-700/80 hover:border-pancho-orange bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300 hover:text-pancho-orange font-sans font-bold uppercase tracking-[0.04em] text-sm transition-[transform,color,background-color,border-color] duration-200 ease-out cursor-pointer active:scale-[0.97]"
            >
              <Plus className="w-4 h-4 text-pancho-orange" />
              <span>Agregar más productos</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

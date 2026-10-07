import { crearPedidoWeb, ErrorPedido } from '@/lib/orders/create'
import { huellaIp } from '@/lib/orders/huella-ip'
import { validarPedido } from '@/lib/orders/validate'

// Recibe el pedido de la web y lo guarda como "pendiente".
export async function POST(request: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'El pedido no es válido.' }, { status: 400 })
  }

  // Campo oculto anti-bots: una persona nunca lo completa. Respondemos como si hubiera
  // salido bien, sin guardar nada, para no darle pistas al bot.
  if (typeof cuerpo === 'object' && cuerpo !== null && 'website' in cuerpo && (cuerpo as { website: unknown }).website) {
    return Response.json({ numero: 0, token: 'x', total: 0 })
  }

  const validado = validarPedido(cuerpo)
  if (!validado.ok) {
    return Response.json({ error: validado.error }, { status: 400 })
  }

  try {
    // IP del cliente: en Vercel la pone la plataforma (el primer valor de x-forwarded-for)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')
    const creado = await crearPedidoWeb(validado.pedido, huellaIp(ip))
    return Response.json(creado, { status: 201 })
  } catch (error) {
    if (error instanceof ErrorPedido) {
      return Response.json({ error: error.message }, { status: error.estado })
    }
    console.error('No se pudo guardar el pedido', error)
    // El cliente usa este código para ofrecer el respaldo por WhatsApp.
    return Response.json({ error: 'No pudimos guardar tu pedido.', respaldoWhatsApp: true }, { status: 500 })
  }
}

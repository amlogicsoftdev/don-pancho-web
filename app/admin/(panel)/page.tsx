import { requerirUsuario } from '@/lib/auth/guards'

export default async function PanelInicio() {
  const usuario = await requerirUsuario()

  return (
    <section>
      <h1 className="mb-2 text-3xl">Hola, {usuario.nombre}</h1>
      <p className="text-cheesy-muted">
        Acá van a aparecer los pedidos y las herramientas del local a medida que se vayan sumando las próximas etapas.
      </p>
    </section>
  )
}

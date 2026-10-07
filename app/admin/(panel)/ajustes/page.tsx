import { requerirDueno } from '@/lib/auth/guards'
import { leerAjustes } from '@/lib/menu/admin-queries'
import { Encabezado } from '../encabezado'
import { AjustesLocal } from './ajustes-local'

// Ajustes generales del local: solo el dueño (como el menú, CLAUDE.md sección 9).
export default async function AjustesPage() {
  await requerirDueno()
  const ajustes = await leerAjustes()

  return (
    <section className="mx-auto max-w-4xl">
      <Encabezado
        titulo="Ajustes"
        descripcion="Datos del local que ve el cliente, la cuenta para transferencias y cuándo cambia el día de caja."
      />
      <div className="mt-6">
        <AjustesLocal corteHora={ajustes.corteHora} transferencia={ajustes.transferencia} local={ajustes.local} />
      </div>
    </section>
  )
}

import { Logo } from '@/components/logo'
import { PanchoButton } from '@/components/pancho-button'
import { SITE_CONFIG } from '@/lib/data'

export default function PedidoNoEncontrado() {
  return (
    <main className="min-h-screen bg-pancho-black px-4 py-10 text-pancho-cream">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <Logo />
        <h1 className="text-5xl text-white">No encontramos tu pedido</h1>
        <p className="text-neutral-300">
          Revisá que el link esté completo. Si el problema sigue, escribinos por WhatsApp y te ayudamos.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <PanchoButton href={`https://wa.me/${SITE_CONFIG.whatsappNumber}`} target="_blank" rel="noopener noreferrer" variant="orange">
            Escribinos
          </PanchoButton>
          <PanchoButton href="/menu" variant="orange">
            Ver el menú
          </PanchoButton>
        </div>
      </div>
    </main>
  )
}

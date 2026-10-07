'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setError(null)
    setEnviando(true)

    const { error } = await authClient.signIn.email({
      email: String(datos.get('email')),
      password: String(datos.get('password')),
    })

    if (error) {
      // Mensaje único: no revelamos si el correo existe o si está desactivado.
      setError('Correo o contraseña incorrectos.')
      setEnviando(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="block">
        <span className="pn-label">Correo</span>
        <input name="email" type="email" required autoComplete="username" className="pn-field" />
      </label>
      <label className="block">
        <span className="pn-label">Contraseña</span>
        <input name="password" type="password" required autoComplete="current-password" className="pn-field" />
      </label>
      {error && (
        <p role="alert" className="pn-alert pn-alert--error">
          {error}
        </p>
      )}
      <Button type="submit" variant="default" size="lg" className="w-full" disabled={enviando}>
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}

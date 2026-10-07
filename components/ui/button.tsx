import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Botón del panel: recto, en mayúsculas, con borde negro. La acción principal de cada pantalla
// va en negro lleno y grande (variant="default", size="lg"). <PanchoButton>, el botón animado,
// es solo para el sitio público.
// Al pasar el mouse invierte sus colores; al apretarlo se achica apenas.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xs border-2 font-sans font-extrabold tracking-[0.06em] whitespace-nowrap uppercase select-none transition-[background-color,color,border-color,transform] duration-200 ease-(--ease-out) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pancho-black active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Negro lleno: acción secundaria con peso (filtrar, agregar)
        default: 'border-pancho-black bg-pancho-black text-white hover:bg-white hover:text-pancho-black',
        // Blanco con borde: la mayoría de las acciones
        outline: 'border-pancho-black bg-white text-pancho-black hover:bg-pancho-black hover:text-white',
        // Naranja: para destacar una acción sin que compita con el botón principal
        secondary: 'border-pancho-black bg-pancho-orange text-pancho-black hover:bg-pancho-black hover:text-white',
        // Sin borde: volver, cancelar, vaciar
        ghost: 'border-transparent bg-transparent text-pancho-black hover:bg-pancho-black/8',
        // Rojo: cancelar o borrar
        destructive:
          'border-pancho-red-deep bg-white text-pancho-red-deep hover:bg-pancho-red-deep hover:text-white focus-visible:outline-pancho-red-deep',
        link: 'border-transparent text-pancho-black underline decoration-pancho-orange decoration-2 underline-offset-4 hover:decoration-pancho-black',
      },
      size: {
        default: 'h-11 px-4 text-xs',
        sm: 'h-10 px-3 text-[0.6875rem]',
        lg: 'h-12 px-5 text-[0.8125rem]',
        icon: 'size-11',
        'icon-sm': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

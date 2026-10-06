'use client'

import React, { useRef, useEffect } from 'react'
import { Flame, Sparkles, ChefHat } from 'lucide-react'
import { useInView } from '@/hooks/use-in-view'
import { PanchoButton } from './pancho-button'
import { SplitLines } from './split-lines'
import { Stamp } from './stamp'
import { TiltPhoto } from './tilt-photo'

interface ScrollPillarBandProps {
  step: string
  title: string
  description: string
  icon: React.ElementType
  direction: 'left-to-right' | 'right-to-left'
  theme: 'dark' | 'orange'
}

function ScrollPillarBand({
  step,
  title,
  description,
  icon: Icon,
  direction,
  theme,
}: ScrollPillarBandProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const paragraphRef = useRef<HTMLDivElement>(null)

  const isLeftToRight = direction === 'left-to-right'
  const isDark = theme === 'dark'

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, posicionamos directamente en su destino
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      if (bannerRef.current) {
        bannerRef.current.style.transform = 'translate3d(0%, 0, 0)'
      }
      if (stepRef.current) {
        stepRef.current.style.opacity = '1'
        stepRef.current.style.transform = 'translate3d(0, 0, 0)'
      }
      if (titleRef.current) {
        titleRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)'
      }
      if (paragraphRef.current) {
        paragraphRef.current.style.opacity = '1'
        paragraphRef.current.style.transform = 'translate3d(0, 0, 0)'
      }
      return
    }

    const updatePositions = () => {
      if (
        !containerRef.current ||
        !stickyRef.current ||
        !bannerRef.current
      ) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const stickyRect = stickyRef.current.getBoundingClientRect()
      const topOffset =
        parseFloat(window.getComputedStyle(stickyRef.current).top) || 112

      const totalDistance = containerRect.height - stickyRect.height
      if (totalDistance <= 0) return

      const distanceTraveled = topOffset - containerRect.top
      const rawProgress = distanceTraveled / totalDistance
      const progress = Math.max(0, Math.min(1, rawProgress))

      const isDesktop = window.innerWidth >= 640
      const maxScale = isDesktop ? 1.4 : 1.28
      const startY = isDesktop ? 36 : 24

      // 1. Desplazamiento horizontal del banner sobre el scroll (llega entre 0 y 0.40)
      const slideProgress = Math.min(1, progress / 0.40)
      const easedSlide =
        slideProgress * slideProgress * (3 - 2 * slideProgress)

      let currentXPercent = 0
      if (isLeftToRight) {
        currentXPercent = -100 * (1 - easedSlide)
      } else {
        currentXPercent = 100 * (1 - easedSlide)
      }

      bannerRef.current.style.transform = `translate3d(${currentXPercent.toFixed(2)}%, 0, 0)`

      // 2. Título: aparece grande y abajo, y entre 0.38 y 0.68 se achica a 1.0 desplazándose hacia arriba
      if (titleRef.current) {
        const settleProgress = Math.max(0, Math.min(1, (progress - 0.38) / 0.30))
        const easedSettle =
          settleProgress * settleProgress * (3 - 2 * settleProgress)
        const currentScale = maxScale - (maxScale - 1) * easedSettle
        const currentY = (1 - easedSettle) * startY

        titleRef.current.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(3)})`
      }

      // 2b. Cabecera con número de paso (aparece suave mientras el título sube)
      if (stepRef.current) {
        const stepProgress = Math.max(0, Math.min(1, (progress - 0.40) / 0.26))
        const easedStep =
          stepProgress * stepProgress * (3 - 2 * stepProgress)

        stepRef.current.style.opacity = easedStep.toFixed(3)
        stepRef.current.style.transform = `translate3d(0, ${((1 - easedStep) * 10).toFixed(2)}px, 0)`
      }

      // 3. Párrafo descriptivo: recién cuando el título terminó de acomodarse (a partir de 0.68), aparece el texto
      if (paragraphRef.current) {
        const pReveal = Math.max(0, Math.min(1, (progress - 0.68) / 0.27))
        const easedReveal =
          pReveal * pReveal * (3 - 2 * pReveal)
        const paragraphY = (1 - easedReveal) * 20

        paragraphRef.current.style.opacity = easedReveal.toFixed(3)
        paragraphRef.current.style.transform = `translate3d(0, ${paragraphY.toFixed(2)}px, 0)`
      }
    }

    updatePositions()

    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        updatePositions()
        rafId = null
      })
    }

    const handleResize = () => {
      updatePositions()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [direction, isLeftToRight])

  return (
    <div
      ref={containerRef}
      className="relative h-[125vh] sm:h-[140vh] lg:h-[150vh] w-full"
    >
      <div
        ref={stickyRef}
        className="sticky top-24 sm:top-28 lg:top-32 w-full z-10 overflow-hidden"
      >
        {/* Contenedor que ingresa desde el costado sobre el fondo negro de la página */}
        <div
          ref={bannerRef}
          className={`
            relative w-full overflow-hidden transition-colors duration-500 rounded-none will-change-transform
            ${
              isDark
                ? 'bg-pancho-black border-y border-neutral-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
                : 'bg-pancho-orange border-y border-pancho-orange-deep'
            }
          `}
          style={{
            transform: isLeftToRight
              ? 'translate3d(-100%, 0, 0)'
              : 'translate3d(100%, 0, 0)',
          }}
        >
          {/* Gráfico decorativo de fondo: posicionado en el lado opuesto al texto para equilibrar el espacio */}
          <div
            className={`pointer-events-none absolute select-none ${
              isLeftToRight
                ? '-left-6 -bottom-10 sm:left-4 lg:left-12'
                : '-right-6 -bottom-10 sm:right-4 lg:right-12'
            } ${isDark ? 'text-white opacity-5' : 'text-black opacity-10'}`}
          >
            <Icon className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96" strokeWidth={1} />
          </div>

          {/* Contenido interior que utiliza todo el ancho de la página */}
          <div className="py-10 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-16 relative z-10 w-full">
            <div
              className={`w-full flex ${
                isLeftToRight ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bloque de texto principal */}
              <div className="w-full max-w-[88%] sm:max-w-md lg:max-w-xl text-left">
                {/* Cabecera del bloque: Paso */}
                <div
                  ref={stepRef}
                  className="mb-2 sm:mb-3 will-change-[opacity,transform]"
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 10px, 0)',
                  }}
                >
                  <span
                    className={`font-display text-4xl sm:text-6xl lg:text-7xl leading-none ${
                      isDark ? 'text-pancho-orange/35' : 'text-black/25'
                    }`}
                  >
                    {step}
                  </span>
                </div>

                {/* Título de la sección: arranca agrandado y desplazado hacia abajo, luego se achica y sube */}
                <h4
                  ref={titleRef}
                  className={`text-3xl sm:text-5xl lg:text-6xl font-display leading-none origin-top-left will-change-transform ${
                    isDark ? 'text-white' : 'text-pancho-black'
                  }`}
                  style={{
                    transformOrigin: 'left top',
                    transform: 'translate3d(0, 36px, 0) scale(1.35)',
                  }}
                >
                  {title}
                </h4>

                {/* Párrafo que aparece recién cuando el título terminó de acomodarse arriba */}
                <div
                  ref={paragraphRef}
                  className="mt-4 sm:mt-6 will-change-[opacity,transform]"
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 24px, 0)',
                  }}
                >
                  <p
                    className={`text-sm sm:text-base lg:text-lg leading-relaxed ${
                      isDark
                        ? 'text-neutral-400 font-normal'
                        : 'text-neutral-900 font-medium'
                    }`}
                  >
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AboutSection() {
  const { ref: heroRef, isInView: isHeroInView } = useInView({
    threshold: 0.25,
    rootMargin: '0px 0px -100px 0px',
  })
  const { ref: pillarsRef, isInView: isPillarsInView } = useInView({
    threshold: 0.3,
    rootMargin: '0px 0px -120px 0px',
  })

  const pillars: Array<{
    step: string
    icon: React.ElementType
    title: string
    description: string
    direction: 'left-to-right' | 'right-to-left'
    theme: 'dark' | 'orange'
  }> = [
    {
      step: '01',
      icon: Flame,
      title: 'El Blend Smash',
      description:
        'Cortes seleccionados 100% novillo. Smasheados al hierro candente para lograr esa costra dorada crocante que concentra todo el jugo.',
      direction: 'left-to-right',
      theme: 'dark',
    },
    {
      step: '02',
      icon: Sparkles,
      title: 'Cascada de Cheddar',
      description:
        'El corazón de Don Pancho. Queso cheddar de verdad, fundido al vapor para envolver cada piso con la textura cremosa que nos define.',
      direction: 'right-to-left',
      theme: 'orange',
    },
    {
      step: '03',
      icon: ChefHat,
      title: 'Pan de Papa Diario',
      description:
        'Horneado cada mañana. Ultra esponjoso, tostado en manteca y con la resistencia justa para aguantar cada bocado sin desarmarse.',
      direction: 'left-to-right',
      theme: 'dark',
    },
  ]

  return (
    <section
      id="nosotros"
      className="relative py-20 sm:py-28 lg:py-36 select-none w-full overflow-x-clip"
    >
      {/* =========================================================
          BLOQUE SUPERIOR: FOTO Y TEXTO
          Todo entra cuando el bloque aparece en pantalla (data-inview).
      ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={heroRef}
          data-inview={isHeroInView}
          className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center"
        >
          {/* Columna izquierda: foto en marco blanco, con profundidad, y el sello girando en la esquina */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <div className="rv-photo w-full max-w-xs sm:max-w-sm">
              <TiltPhoto
                src="/images/burger-1.webp"
                alt="Hamburguesa de Don Pancho & Burger con cheddar, bacon, tomate y lechuga"
                sizes="(max-width: 640px) 320px, 384px"
                imageClassName="object-[50%_72%]"
              >
                <div className="tilt-float -right-3 -bottom-9 sm:-right-10 sm:-bottom-10">
                  <div className="rv-pop" style={{ '--d': '700ms' } as React.CSSProperties}>
                    <Stamp className="size-28 sm:size-36" />
                  </div>
                </div>
              </TiltPhoto>
            </div>
          </div>

          {/* Columna derecha: etiqueta, título línea por línea, texto y botón */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="rv-wipe inline-block -rotate-3 bg-pancho-red px-2 py-1 font-sans text-[19px] font-extrabold uppercase leading-[1.1] text-white sm:text-xl sm:tracking-[0.02em]">
              Sobre nosotros
            </span>

            <h2
              style={{ '--d': '120ms' } as React.CSSProperties}
              className="rv-lines mt-5 text-5xl sm:text-7xl lg:text-8xl text-white leading-[0.95]"
            >
              <SplitLines lines={['Una pasión', 'que se', 'comparte']} />
            </h2>

            <p
              style={{ '--d': '420ms' } as React.CSSProperties}
              className="rv-up mt-6 text-neutral-300 text-base sm:text-lg leading-relaxed max-w-lg font-normal"
            >
              En <strong className="text-white font-semibold">Don Pancho & Burger</strong> creemos que una buena hamburguesa no es solo comida, es una experiencia. Por eso, usamos ingredientes de calidad, recetas originales y mucho amor en cada pedido.
            </p>

            <div className="rv-up mt-8" style={{ '--d': '540ms' } as React.CSSProperties}>
              <PanchoButton href="/menu" variant="orange">
                Ver el menú
              </PanchoButton>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          BLOQUE INFERIOR: NUESTRO SECRETO ARTESANAL (SCROLL-DRIVEN)
      ========================================================= */}
      <div className="mt-28 sm:mt-36 pt-16 border-t border-neutral-900 w-full">
        {/* Encabezado de un solo color: sube desde atrás de la máscara */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={pillarsRef}
            data-inview={isPillarsInView}
            className="text-center max-w-4xl mx-auto mb-16 sm:mb-24"
          >
            <h3 className="rv-lines text-4xl sm:text-6xl lg:text-7xl text-white leading-[0.95]">
              <SplitLines lines={['Nuestro secreto artesanal']} />
            </h3>

            <p
              style={{ '--d': '250ms' } as React.CSSProperties}
              className="rv-up mt-4 text-neutral-400 text-sm sm:text-base max-w-xl mx-auto font-normal"
            >
              Tres pilares donde la temperatura, los cortes seleccionados y la textura se funden a medida que avanzás en el recorrido.
            </p>
          </div>
        </div>

        {/* Las 3 secciones intercaladas que usan todo el largo de la página (w-full, sin padding lateral) */}
        <div className="w-full space-y-16 sm:space-y-24">
          {pillars.map((pillar) => (
            <ScrollPillarBand
              key={pillar.step}
              step={pillar.step}
              title={pillar.title}
              description={pillar.description}
              icon={pillar.icon}
              direction={pillar.direction}
              theme={pillar.theme}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

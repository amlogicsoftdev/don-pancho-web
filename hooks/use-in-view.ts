'use client'

import { useEffect, useRef, useState } from 'react'

export function useInView(options: IntersectionObserverInit = { threshold: 0.15 }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isInView, setIsInView] = useState(false)
  const threshold = options.threshold ?? 0.15
  const rootMargin = options.rootMargin ?? '0px'

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [threshold, rootMargin])

  return { ref, isInView }
}

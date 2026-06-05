import { useEffect, useState } from "react"

export const useIntersection = (
  element: React.RefObject<Element | null>,
  rootMargin: string
) => {
  const [isVisible, setState] = useState(false)

  useEffect(() => {
    const current = element?.current
    if (!current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setState(entry.isIntersecting)
      },
      { rootMargin }
    )

    observer.observe(current)

    return () => {
      observer.unobserve(current)
    }
  }, [element, rootMargin])

  return isVisible
}

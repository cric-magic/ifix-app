import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Shows fixed-width content the way a document viewer does: at its true
// layout, scaled down to fit a container narrower than `width` — rather than
// the content narrowing and its text reflowing into a strip several times
// its height (a contract page at phone width). Never scaled up past true
// size. `zoom` rather than a transform so the scaled content takes up only
// its scaled height. Print resets the zoom (see index.css's print rules).
export function FitToWidth({ width, children }: { width: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(entries => setAvailable(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const zoom = available ? Math.min(1, available / width) : 1

  return (
    <div ref={ref}>
      <div className="ifix-fit-to-width" style={{ zoom }}>{children}</div>
    </div>
  )
}

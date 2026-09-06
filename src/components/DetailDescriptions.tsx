import { useEffect, useRef, useState } from 'react'
import { Descriptions } from 'antd'
import type { DescriptionsProps } from 'antd'

// Shared attribute grid for every detail page's page-header panel (see
// Products' OverviewTab for the pattern this all traces back to).
//
// This used to pick its column count off antd's own `column={{ xs, sm,
// lg, ... }}` responsive prop — but that reads *window* width, not the
// actual content area's width, and every one of these panels sits in a
// fixed-sidebar app shell where the real content area is always narrower
// than the window it'd be measured against. A "lg" (992px) window still
// only leaves ~700px of actual content width once the sidebar and padding
// are subtracted, so a 2-or-3-column grid picked by window breakpoint
// kept squeezing values (a bank format label like "Auto-running" wrapping
// letter by letter) even after capping the column count once already.
//
// Fixed for real this time by measuring the panel's own rendered width via
// ResizeObserver and deciding from that: two columns if there's room for
// them, one full-width (vertical, label-above-value) column otherwise.
// This is what "responds to the viewport" has to mean here — not the
// window, but the space this component actually has.
const TWO_COLUMN_MIN_WIDTH = 480

export function DetailDescriptions(props: DescriptionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Two columns only once measured wide enough to fit them — null (not
  // measured yet, first paint) also stacks, so there's never a flash of
  // cramped columns before the real width is known.
  const twoColumn = width !== null && width >= TWO_COLUMN_MIN_WIDTH

  return (
    <div ref={containerRef}>
      <Descriptions
        className="ifix-compact-descriptions"
        bordered={false}
        layout={twoColumn ? 'horizontal' : 'vertical'}
        column={twoColumn ? 2 : 1}
        labelStyle={{ fontSize: 14 }}
        contentStyle={{ fontSize: 14 }}
        {...props}
      />
    </div>
  )
}

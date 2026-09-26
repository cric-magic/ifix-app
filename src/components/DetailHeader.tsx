import type { ReactNode } from 'react'
import { Typography } from 'antd'
import { useIsMobile } from './useIsMobile'

interface Props {
  title: ReactNode
  // Status and type tags, beside the title on desktop, above it on mobile.
  tags?: ReactNode
  // A 40px thumbnail (product photo, merchant logo) before the title —
  // shown at 60px on mobile, where the tags stack above the title.
  leading?: ReactNode
  // Desktop only — on mobile the page renders its actions in a
  // MobileActionBar at the bottom instead.
  actions?: ReactNode
}

// The entity detail page header. antd dropped PageHeader from core in v5+,
// so this reproduces its layout by hand: title and tags on the left, actions
// on the right, no card chrome.
//
// Mobile: the tags sit above the title as a small label, so the (often
// long) name gets the full width, and the actions leave the header for the
// page's bottom bar.
const LEADING_MOBILE_ZOOM = 60 / 40

export function DetailHeader({ title, tags, leading, actions }: Props) {
  const isMobile = useIsMobile()
  const heading = <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>

  if (isMobile) {
    const stack = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
        {tags && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{tags}</div>}
        {heading}
      </div>
    )
    return (
      <div style={{ marginBottom: 16 }}>
        {leading
          ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* The 40px thumbnail scaled to 60px — the height of the tag
                  and title stacked beside it (24 + 8 + 28) — so its top
                  lines up with the tag and its bottom with the title,
                  instead of floating between them. Every page builds its
                  own thumbnail (photo, logo, photo stack), so it's scaled
                  as a whole here rather than resized in each. */}
              <div style={{ flexShrink: 0, display: 'flex', zoom: LEADING_MOBILE_ZOOM }}>{leading}</div>
              {stack}
            </div>
          )
          : stack}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', gap: 12 }}>
        {leading}
        {heading}
        {tags && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{tags}</div>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
    </div>
  )
}

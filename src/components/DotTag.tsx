import { Tag, theme } from 'antd'

interface Props {
  dotColor: string
  textColor?: string
  children: React.ReactNode
}

// Shared status-tag look: same neutral background as the default Tag
// (App.tsx's Tag.defaultBg override), secondary text by default (small
// tag text, antd's own fontSizeSM, not full body size) — pass textColor to
// override the tier (e.g. tertiary for de-emphasized states like
// unavailable/sold) — and a small dot in the semantic/functional color so
// the color carries the meaning instead of the whole pill being tinted.
// Was colorFillTertiary, which this theme's solid-color conversion blends
// against colorBgLayout — the same value colorBgElevated lands on — so the
// pill was nearly invisible on any panel (see the matching Select/Table/
// Button fixes in App.tsx).
export function DotTag({ dotColor, textColor, children }: Props) {
  const { token } = theme.useToken()
  return (
    <Tag
      style={{
        margin: 0,
        background: token.colorFillSecondary,
        color: textColor ?? token.colorTextSecondary,
        fontSize: token.fontSizeSM,
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      {children}
    </Tag>
  )
}

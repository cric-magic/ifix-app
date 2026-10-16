import { Tag, theme } from 'antd'
import { useTones, type Tone } from './tones'
import type { StatusBadge } from '../constants/statusBadges'

interface Props {
  tone: Tone
  muted?: boolean
  children: React.ReactNode
}

// Every status tag in the app: a small dot in its tone's dot colour, on that
// tone's fill (components/tones.ts), with secondary text at antd's
// fontSizeSM. muted drops a switched-off state to tertiary text
// (Unavailable, Disabled). The colour lives in the dot and the fill; the
// text stays neutral so it reads at tag size.
export function DotTag({ tone, muted, children }: Props) {
  const { token } = theme.useToken()
  const { dot, fill } = useTones()[tone]
  return (
    <Tag
      style={{
        margin: 0,
        background: fill,
        color: muted ? token.colorTextTertiary : token.colorTextSecondary,
        fontSize: token.fontSizeSM,
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {children}
    </Tag>
  )
}

// A status from the status map (constants/statusBadges.ts) as its tag.
export function StatusTag({ badge }: { badge: StatusBadge }) {
  return <DotTag tone={badge.tone} muted={badge.muted}>{badge.label}</DotTag>
}

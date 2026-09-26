import { Steps, Typography, theme } from 'antd'
import { useIsMobile } from './useIsMobile'

interface Props {
  current: number
  titles: string[]
}

// A wizard's progress in the app header (Create/Edit Contract).
//
// Desktop: antd Steps as compact circles, only the current step titled (see
// .ifix-header-steps in index.css).
//
// Mobile: five circles plus a title don't fit beside the sidebar and close
// buttons, so it collapses to the current step's name and "N of M" — the
// same information, as text that truncates instead of overlapping.
export function HeaderSteps({ current, titles }: Props) {
  const isMobile = useIsMobile()
  const { token } = theme.useToken()

  if (!isMobile) {
    return (
      <Steps current={current} items={titles.map(title => ({ title }))} size="small" className="ifix-header-steps" style={{ fontSize: 14 }} />
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, lineHeight: 'normal' }}>
      <Typography.Text strong ellipsis style={{ fontSize: 14, minWidth: 0 }}>{titles[current]}</Typography.Text>
      <span style={{ fontSize: 14, color: token.colorTextTertiary, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {current + 1} of {titles.length}
      </span>
    </div>
  )
}

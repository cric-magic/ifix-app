import type { ReactNode } from 'react'
import { Segmented, theme } from 'antd'
import { useIsMobile } from './useIsMobile'
import { useTones, type Tone } from './tones'

export interface CountTab<T extends string> {
  value: T
  label: ReactNode
  count: number
  // The pill's tone (components/tones.ts) — a status tab's matches that
  // status's tag in the list below; neutral where a tab has no status.
  tone?: Tone
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  tabs: CountTab<T>[]
}

// A list page's leading tabs, each with how many it holds — "All 140 ·
// Available 131 · Reserved 6 · Sold 3" — so the split reads at a glance and
// a tap filters to it. Used by the Catalog (condition) and the Units list
// (status), in ListToolbar's leading slot.
//
// The count sits in a pill, the familiar "Issues 12" treatment. A status
// tab's pill takes a faint tint of that status's colour — the same one its
// dot has in the list below — so the tabs and the rows read as one system;
// any other tab's pill is a neutral grey, dark enough to stand out on the
// unselected tabs' grey track as well as on the selected tab. On a phone
// the tabs share the width, so each count sits under its label rather than
// beside it.
export function CountTabs<T extends string>({ value, onChange, tabs }: Props<T>) {
  const { token } = theme.useToken()
  const isMobile = useIsMobile()

  const tones = useTones()

  const pill = (count: number, tone: Tone = 'neutral') => (
    <span style={{
      background: tones[tone].background,
      color: tones[tone].color,
      display: 'inline-block',
      minWidth: 20,
      paddingInline: 6,
      borderRadius: 999,
      fontSize: token.fontSizeSM,
      lineHeight: '18px',
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {count}
    </span>
  )

  return (
    <Segmented<T>
      value={value}
      onChange={onChange}
      style={{ flexShrink: 0 }}
      options={tabs.map(tab => ({
        value: tab.value,
        label: isMobile ? (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1.3, paddingBlock: 4 }}>
            <span>{tab.label}</span>
            {pill(tab.count, tab.tone)}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {pill(tab.count, tab.tone)}
          </span>
        ),
      }))}
    />
  )
}

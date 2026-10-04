import { Tag, theme } from 'antd'
import { tintOf } from './tones'

interface Props {
  dotColor: string
  textColor?: string
  children: React.ReactNode
}

// Every status tag in the app: a small dot in the status's functional
// colour, on a faint tint of that same colour (tintOf — 16% of the dot over
// transparent), with secondary text by default at antd's fontSizeSM. Pass
// textColor to drop a de-emphasised state to tertiary (sold, unavailable,
// archived). The colour lives in the dot and the fill; the text stays
// neutral so it reads at tag size — this theme's green and amber are too
// bright to carry small text on their own tint.
export function DotTag({ dotColor, textColor, children }: Props) {
  const { token } = theme.useToken()
  return (
    <Tag
      style={{
        margin: 0,
        background: tintOf(dotColor),
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

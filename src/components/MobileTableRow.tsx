import type { ReactNode } from 'react'
import { Button, theme } from 'antd'
import { MoreHorizontal } from 'lucide-react'

interface Props {
  // The row's identifier — contract number, product name, serial number.
  primary: ReactNode
  // One or two supporting values, joined on the second line.
  secondary?: ReactNode
  // Top right: usually the status tag.
  trailing?: ReactNode
  // Bottom right: the key number (an amount, a count).
  trailingSecondary?: ReactNode
  // Left of both lines: a thumbnail or avatar, where the desktop row has one.
  // 44px, the height of the two lines together, so its top and bottom edges
  // line up with the text's instead of floating inside it.
  leading?: ReactNode
  // The row's "…", opening its action sheet (see useActionSheet). Omitted
  // when the viewer has no actions on the row.
  onMore?: () => void
}

// A list table's row on mobile, as a compact two-line item instead of a
// strip of columns that scrolls sideways:
//
//   SGR-20260601-000002                ● Active
//   Siriporn Thaweesak · iPhone 17     ฿21,708
//
// Rendered as the single column of the same antd Table the desktop uses, so
// pagination, the pinned header/footer layout, empty states and row taps all
// keep working. Both lines truncate rather than wrap; the right-hand side
// keeps its natural width.
//
// Any row with actions shows "…" (`onMore`), opening its action sheet — the
// same actions as the desktop "…" menu. Tapping the row itself opens its
// detail page where it has one, or the action sheet where it doesn't.
export function MobileTableRow({ primary, secondary, trailing, trailingSecondary, leading, onMore }: Props) {
  const { token } = theme.useToken()
  const line = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 } as const
  const truncate = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const

  const lines = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
      {/* One line always: when the identifier and the trailing tag don't both
          fit, the identifier truncates rather than the tag dropping below. */}
      <div style={line}>
        <span style={{ ...truncate, color: token.colorText }}>{primary}</span>
        {trailing && <span style={{ flexShrink: 0 }}>{trailing}</span>}
      </div>
      {(secondary || trailingSecondary) && (
        <div style={line}>
          <span style={{ ...truncate, color: token.colorTextTertiary, fontSize: token.fontSizeSM }}>{secondary}</span>
          {trailingSecondary && (
            <span style={{ flexShrink: 0, color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{trailingSecondary}</span>
          )}
        </div>
      )}
    </div>
  )

  if (!leading && !onMore) return lines

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      {leading && <div style={{ flexShrink: 0, display: 'flex' }}>{leading}</div>}
      {lines}
      {onMore && (
        <Button
          type="text"
          size="small"
          aria-label="More actions"
          icon={<MoreHorizontal size={16} strokeWidth={2.25} />}
          style={{ flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onMore() }}
        />
      )}
    </div>
  )
}

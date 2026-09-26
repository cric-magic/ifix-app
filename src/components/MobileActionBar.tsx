import type { ReactNode } from 'react'
import { Button, Dropdown } from 'antd'
import { MoreHorizontal } from 'lucide-react'

export interface MoreAction {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
}

interface Props {
  // The page's next step: one button full width, or a decision pair
  // (Reject | Approve) splitting the row.
  children?: ReactNode
  // Everything else, behind a "…" button at the end of the bar.
  more?: MoreAction[]
}

// A detail page's actions on mobile, pinned to the bottom of the screen
// instead of stacked under the title: always reachable while scrolling the
// page, and where the thumb is. At most two buttons in the bar — the rest go
// into "…" — so a page with many actions never becomes a wall of buttons.
// See .ifix-action-bar in index.css.
export function MobileActionBar({ children, more = [] }: Props) {
  if (!children && more.length === 0) return null

  return (
    <div className="ifix-action-bar">
      {children && <div className="ifix-action-bar-main">{children}</div>}
      {more.length > 0 && (
        <Dropdown
          trigger={['click']}
          placement="topRight"
          menu={{
            items: more.map(a => ({ key: a.key, label: a.label, icon: a.icon, danger: a.danger })),
            onClick: ({ key }) => more.find(a => a.key === key)?.onClick(),
          }}
        >
          <Button aria-label="More actions" icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
        </Dropdown>
      )}
    </div>
  )
}

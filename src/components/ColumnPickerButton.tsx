import { useState } from 'react'
import { Button, Dropdown, theme } from 'antd'
import { Check, Columns3 } from 'lucide-react'

// The header button and menu for useColumnPicker (see there).
export interface ColumnPickerItem {
  key: string
  label: string
  visible: boolean
  locked: boolean
}

// Its own component so each rendered copy keeps its own open state: antd
// also renders every header title into an invisible measuring row, and a
// shared open flag opened that hidden copy's menu alongside the real one.
export function ColumnPickerButton({ items, onToggle }: { items: ColumnPickerItem[]; onToggle: (key: string) => void }) {
  const [open, setOpen] = useState(false)
  const { token } = theme.useToken()

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      open={open}
      // Only the button opens or closes it — ticking a column keeps the menu
      // open so several can be changed in one go.
      onOpenChange={(next, info) => { if (info.source === 'trigger') setOpen(next) }}
      menu={{
        items: items.map(item => ({
          key: item.key,
          label: item.label,
          disabled: item.locked,
          // Check on the right, in the primary colour — the same way the
          // app's multi-select dropdowns (e.g. a user's permitted categories)
          // mark a chosen option. Locked columns keep theirs but greyed with
          // the rest of the disabled row.
          extra: item.visible
            ? <Check size={14} strokeWidth={2.25} style={{ display: 'block', color: item.locked ? undefined : token.colorPrimary }} />
            : null,
        })),
        onClick: ({ key }) => onToggle(key),
        // A long table can list a lot of columns — capped at 256px, the same
        // height antd's Select dropdowns stop at, and scrolled beyond that.
        style: { maxHeight: 256, overflowY: 'auto' },
      }}
    >
      {/* Same size and icon as the "…" buttons in the rows below. */}
      <Button type="text" size="small" aria-label="Choose columns" icon={<Columns3 size={16} strokeWidth={2.25} />} />
    </Dropdown>
  )
}

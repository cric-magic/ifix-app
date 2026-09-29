import type { ReactNode } from 'react'
import type { MenuProps } from 'antd'

// One action on a table row — Edit, Duplicate, Archive… Defined once per
// table and rendered two ways: the desktop "…" dropdown (rowActionMenu) and
// the mobile action sheet (useActionSheet), so the two can't drift apart.
export interface RowAction {
  key: string
  label: string
  icon?: ReactNode
  // Destructive (Archive, Remove, Void): red, and set apart at the end.
  danger?: boolean
  onClick: () => void
}

// The desktop dropdown's menu for a row's actions — destructive ones after
// a divider, like the app's other "…" menus.
export function rowActionMenu(actions: RowAction[]): MenuProps {
  const safe = actions.filter(a => !a.danger)
  const danger = actions.filter(a => a.danger)
  return {
    items: [
      ...safe.map(a => ({ key: a.key, label: a.label, icon: a.icon })),
      ...(safe.length && danger.length ? [{ type: 'divider' as const }] : []),
      ...danger.map(a => ({ key: a.key, label: a.label, icon: a.icon, danger: true })),
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation()
      actions.find(a => a.key === key)?.onClick()
    },
  }
}

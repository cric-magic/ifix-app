import { Button, Drawer, theme } from 'antd'
import { useAppWindowContainer } from '../contexts/AppWindowContext'
import type { RowAction } from './rowActions'

interface Props {
  open: boolean
  // What the actions are for — the row's name ("Standard Fixed Rate").
  title: string
  actions: RowAction[]
  onClose: () => void
}

// A row's actions on mobile, for lists whose rows have no detail page to
// open: a bottom sheet (like ListToolbar's Filters) with each action as a
// full-width, thumb-sized button — easier to hit than a small dropdown menu,
// and never opening off-screen. Destructive actions come last, in red, after
// a divider. Choosing one closes the sheet, then runs it.
export function ActionSheet({ open, title, actions, onClose }: Props) {
  const { token } = theme.useToken()
  const appWindow = useAppWindowContainer()
  const safe = actions.filter(a => !a.danger)
  const danger = actions.filter(a => a.danger)

  function run(action: RowAction) {
    onClose()
    action.onClick()
  }

  const item = (action: RowAction) => (
    <Button
      key={action.key}
      type="text"
      block
      danger={action.danger}
      icon={action.icon}
      onClick={() => run(action)}
      style={{ height: 44, justifyContent: 'flex-start', paddingInline: 12 }}
    >
      {action.label}
    </Button>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      size="auto"
      title={title}
      getContainer={appWindow ?? undefined}
      styles={{ body: { padding: 8 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {safe.map(item)}
        {safe.length > 0 && danger.length > 0 && (
          <div style={{ height: 0.5, background: token.colorSplit, margin: '4px 12px' }} />
        )}
        {danger.map(item)}
      </div>
    </Drawer>
  )
}

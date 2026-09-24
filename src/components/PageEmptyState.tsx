import { TableEmptyState } from './TableEmptyState'

interface Props {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

// A whole page with nothing to show — a record that doesn't exist, or a page
// this role can't use. The same icon-and-text pattern as a table's empty
// state (TableEmptyState), centred in the page, instead of antd's Result
// illustrations.
export function PageEmptyState(props: Props) {
  return (
    <div style={{ height: '100%', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TableEmptyState {...props} />
    </div>
  )
}

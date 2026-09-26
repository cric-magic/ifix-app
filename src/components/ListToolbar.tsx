import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Button, Drawer, Typography, theme } from 'antd'
import { ListFilter, Plus } from 'lucide-react'
import { useAppWindowContainer } from '../contexts/AppWindowContext'
import { useIsMobile } from './useIsMobile'

export interface ListFilterField {
  key: string
  // Shown above the control in the mobile filter sheet, where there's no
  // placeholder-only dropdown row to read it from.
  label: string
  control: ReactNode
}

interface Props {
  // A filter that stays in view at every size rather than folding into the
  // mobile Filters sheet — Products' New/Used switch, which clients need
  // to see. Before the search on desktop, a full-width row above it on
  // mobile.
  leading?: ReactNode
  search: ReactNode
  filters?: ListFilterField[]
  // How many filters are narrowing the list right now — the badge on the
  // mobile Filters button, and whether "Clear filters" shows.
  activeFilterCount?: number
  onClearFilters?: () => void
  action?: { label: string; onClick: () => void }
}

// The row above a list page's table: search, filters and the primary
// action.
//
// Desktop keeps the layout every list page already had — search and filter
// dropdowns on the left, a labelled primary button on the right, the row
// scrolling sideways if it ever runs out of room.
//
// Mobile folds it into one row that always fits: search takes the width, the
// filters collapse into a Filters button (with a count of active filters)
// that opens them stacked in a bottom sheet, and the primary action becomes a
// square "+" button that keeps its label for screen readers. Filters still
// apply the moment they change — the sheet is just where they live.
export function ListToolbar({ leading, search, filters = [], activeFilterCount = 0, onClearFilters, action }: Props) {
  const isMobile = useIsMobile()
  const { token } = theme.useToken()
  const appWindow = useAppWindowContainer()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!isMobile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, overflowX: 'auto', overflowY: 'clip' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {leading}
          {search}
          {filters.map(f => <div key={f.key} style={{ display: 'contents' }}>{f.control}</div>)}
        </div>
        {action && (
          <Button type="primary" icon={<Plus size={16} strokeWidth={2.25} />} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {leading && <div className="ifix-toolbar-leading">{leading}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="ifix-toolbar-search" style={{ flex: 1, minWidth: 0 }}>{search}</div>
        {filters.length > 0 && (
          <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
            <Button
              aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters'}
              icon={<ListFilter size={16} strokeWidth={2.25} />}
              onClick={() => setSheetOpen(true)}
            />
          </Badge>
        )}
        {action && (
          <Button type="primary" aria-label={action.label} icon={<Plus size={16} strokeWidth={2.25} />} onClick={action.onClick} />
        )}

        <Drawer
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          placement="bottom"
          size="auto"
          title="Filters"
          getContainer={appWindow ?? undefined}
          extra={activeFilterCount > 0 && onClearFilters && (
            // 24px tall, the same as the header's title and close icon — the
            // small button's own height made the header grow when it appeared.
            <Button type="link" size="small" onClick={onClearFilters} style={{ paddingInline: 0, height: 24 }}>
              Clear filters
            </Button>
          )}
        >
          <div className="ifix-filter-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filters.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Typography.Text style={{ fontSize: 14, color: token.colorTextSecondary }}>{f.label}</Typography.Text>
                {f.control}
              </div>
            ))}
          </div>
        </Drawer>
      </div>
    </div>
  )
}

import type { ColumnsType } from 'antd/es/table'

// The row's name column — the one people scan down — gets the most room,
// and every other data column a floor so a short value ("New", "5G") or a
// narrow header doesn't collapse its column to a sliver. Columns that set
// their own width (the "…" actions, the column picker) keep it.
export const PRIMARY_COLUMN_MIN_WIDTH = 240
export const COLUMN_MIN_WIDTH = 120

export function withColumnMinWidths<T>(columns: ColumnsType<T>, primaryKey = 'name'): ColumnsType<T> {
  return columns.map(c => {
    if (c.width != null || c.minWidth != null) return c
    return c.key === primaryKey
      // width 100% makes the name column take any spare width the others
      // don't need, so it grows when columns are hidden or the table is
      // wide, while the rest stay at their natural width.
      ? { ...c, width: '100%', minWidth: PRIMARY_COLUMN_MIN_WIDTH }
      : { ...c, minWidth: COLUMN_MIN_WIDTH }
  })
}

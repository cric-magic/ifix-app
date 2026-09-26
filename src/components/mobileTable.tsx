import type { ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'

// The pieces every list table swaps in on mobile (see useIsMobile), so a
// table only has to say what goes in its MobileTableRow:
//
//   columns={isMobile ? mobileColumns(r => <MobileTableRow … />) : columns}
//   {...(isMobile ? MOBILE_TABLE_PROPS : {})}
//   scroll={isMobile ? { y: '100%' } : { x: 'max-content', y: '100%' }}
//   pagination={{ …, ...(isMobile ? MOBILE_PAGINATION : {}) }}
//
// One column rendering the whole row, no header row (the layout is fixed,
// so there's nothing to label or pick), 0.5px dividers and 12px row padding
// (.ifix-mobile-rows), and a fixed table layout so the column is the
// panel's width and long values truncate instead of widening the row.
export const MOBILE_TABLE_PROPS = {
  showHeader: false,
  className: 'ifix-mobile-rows',
  tableLayout: 'fixed' as const,
}

export function mobileColumns<T>(render: (record: T) => ReactNode): ColumnsType<T> {
  return [{ key: 'mobile', render: (_, record) => render(record) }]
}

// The panel's padding around the table: none on top on mobile, where
// there's no header row for it to sit above.
export function tablePanelPadding(isMobile: boolean) {
  return isMobile ? '0 16px 16px' : 16
}

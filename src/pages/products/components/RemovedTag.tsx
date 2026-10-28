import { Tag, theme } from 'antd'

// The neutral "Removed" tag beside a removed (soft-deleted) product's name —
// on its units (UnitProductName) and in the Catalog's Removed tab — the same
// treatment the app uses for "Default".
export function RemovedTag() {
  const { token } = theme.useToken()
  return (
    <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
      Removed
    </Tag>
  )
}

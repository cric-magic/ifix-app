import { Navigate, useNavigate } from 'react-router-dom'
import { ConfigProvider, Table, Tag, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCurrentUser } from '../../contexts/AuthContext'
import { canManageProductAttributes } from '../../constants/roles'
import { ATTRIBUTE_TYPES, attributeValues, type AttributeTypeMeta } from '../../constants/products'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { countProductsUsingAttribute } from '../../utils/product'

// An index of attribute types rather than every value stacked on one page.
// Two reasons: a single type's list grows without bound (colours especially),
// and new types get added over time — stacking made you scroll past one to
// reach the next, and got worse with each addition. Drilling in matches how
// the rest of the app navigates (Catalog, Members, Merchants all list then
// drill), keeps this page short whatever happens below it, and makes each
// type's values a real URL.
export function AttributesPage() {
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()

  if (!canManageProductAttributes(actor)) {
    return <Navigate to="/products/catalog" replace />
  }

  const columns: ColumnsType<AttributeTypeMeta> = [
    {
      title: <span style={{ color: token.colorText }}>Attribute</span>,
      key: 'label',
      render: (_, meta) => <span style={{ color: token.colorText }}>{meta.label}</span>,
    },
    {
      title: 'Values',
      key: 'values',
      align: 'right',
      render: (_, meta) => {
        const values = attributeValues(meta)
        const enabled = values.filter(v => v.enabled).length
        // Only managed types can have disabled values, so the "of N" half
        // would be noise on a fixed list.
        return meta.managed && enabled !== values.length
          ? `${enabled} of ${values.length}`
          : values.length
      },
    },
    {
      title: 'In use',
      key: 'inUse',
      align: 'right',
      render: (_, meta) => {
        const used = attributeValues(meta)
          .filter(v => countProductsUsingAttribute(meta.field, v.value, MOCK_PRODUCTS) > 0).length
        return used > 0 ? used : <span style={{ color: token.colorTextDisabled }}>—</span>
      },
    },
    {
      title: 'Managed',
      key: 'managed',
      fixed: 'right',
      render: (_, meta) => (
        <Tag style={{
          margin: 0,
          background: token.colorFillSecondary,
          color: token.colorTextSecondary,
          fontSize: token.fontSizeSM,
          border: 'none',
        }}>
          {meta.managed ? 'Editable' : 'Fixed'}
        </Tag>
      ),
    },
  ]

  return (
    <div className="ifix-table-panel">
      <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="key"
              columns={columns}
              dataSource={ATTRIBUTE_TYPES}
              pagination={false}
              onRow={meta => ({
                onClick: () => navigate(`/products/attributes/${meta.key}`),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        </div>
      </ConfigProvider>
    </div>
  )
}

import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Tabs } from 'antd'
import { useCurrentUser } from '../../contexts/AuthContext'
import { canManageProductAttributes } from '../../constants/roles'
import { ATTRIBUTE_TYPES, attributeType } from '../../constants/products'
import { AttributeValuesTab } from './components/AttributeValuesTab'

// One tab per attribute type, with that type's values below. Tabs rather
// than a drill-in because the two things scale differently: attribute types
// are a small, slowly-growing set (four today), while a single type's values
// grow without bound — and the values table handles that itself with search
// and pagination. So the navigation only has to cope with the small axis,
// which makes the extra page a drill-in would cost pure overhead.
//
// The active tab lives in the URL rather than component state so a specific
// attribute stays linkable and survives a refresh.
export function AttributesPage() {
  const actor = useCurrentUser()
  const navigate = useNavigate()
  const { type } = useParams<{ type: string }>()

  if (!canManageProductAttributes(actor)) {
    return <Navigate to="/products/catalog" replace />
  }

  // Bare /products/attributes, or a type that doesn't exist, settles on the
  // first tab rather than erroring — there's nothing to 404 over here.
  const active = (type && attributeType(type)) ? type : ATTRIBUTE_TYPES[0].key

  return (
    // Each tab is a list view, so the tabs pass the fill-height layout down
    // to it (see .ifix-fill-tabs / .ifix-fill-page in index.css).
    <Tabs
      className="ifix-fill-tabs"
      activeKey={active}
      onChange={key => navigate(`/products/attributes/${key}`)}
      items={ATTRIBUTE_TYPES.map(meta => ({
        key: meta.key,
        label: meta.label,
        children: <AttributeValuesTab meta={meta} />,
      }))}
    />
  )
}

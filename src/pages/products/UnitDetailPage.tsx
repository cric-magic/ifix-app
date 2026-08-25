import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Descriptions, Image, Result, Typography, message, theme } from 'antd'
import { ImageOff, Pencil } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { canManageUnits, canViewProducts } from '../../constants/roles'
import { GRADE_LABELS, TAX_LABELS } from '../../constants/products'
import { useIconColors } from '../../constants/iconColors'
import { IMAGE_PREVIEW_CLOSE_ICON } from '../../constants/imagePreviewIcons'
import { UnitAvailabilityTag } from './components/UnitAvailabilityTag'
import { EditUnitModal } from './components/EditUnitModal'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function UnitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [editOpen, setEditOpen] = useState(false)
  const [version, setVersion] = useState(0)

  const unit = MOCK_PRODUCT_UNITS.find(u => u.id === id)
  void version

  if (!canViewProducts(user)) {
    return (
      <Result
        status="403"
        title="Not applicable"
        subTitle="Units are scoped to a merchant workspace. Super Admin operates at the platform level."
        extra={<Button onClick={() => navigate('/contracts')}>Back home</Button>}
      />
    )
  }

  if (!unit) {
    return (
      <Result
        status="404"
        title="Unit not found"
        extra={<Button onClick={() => navigate('/products/unit')}>Back to list</Button>}
      />
    )
  }

  const product = MOCK_PRODUCTS.find(p => p.id === unit.productId)
  const canEdit = canManageUnits(user)
  const soldByUser = unit.soldAt ? MOCK_USER_ACCOUNTS.find(a => a.id === unit.soldBy) : undefined

  const allPhotos = [
    unit.unitPhotos?.front && { src: unit.unitPhotos.front, label: 'Front' },
    unit.unitPhotos?.back && { src: unit.unitPhotos.back, label: 'Back' },
    unit.unitPhotos?.imeiLabel && { src: unit.unitPhotos.imeiLabel, label: 'IMEI Label' },
    unit.unitPhotos?.sealWrap && { src: unit.unitPhotos.sealWrap, label: 'Seal / Wrap' },
    ...(unit.defectPhotos ?? []).map((src, i) => ({ src, label: `Defect ${i + 1}` })),
  ].filter((p): p is { src: string; label: string } => !!p)

  const detailItems = [
    {
      key: 'product',
      label: 'Product',
      children: product ? (
        <a onClick={() => navigate(`/products/catalog/${product.id}`)} style={{ color: token.colorText }}>
          {product.name}
        </a>
      ) : '—',
    },
    { key: 'serialNumber', label: 'Serial Number', children: unit.serialNumber },
    { key: 'branch', label: 'Branch', children: unit.branch },
    { key: 'grade', label: 'Grade', children: unit.grade ? GRADE_LABELS[unit.grade] : <span style={{ color: token.colorTextDisabled }}>—</span> },
    { key: 'tax', label: 'Tax', children: TAX_LABELS[unit.tax] },
    {
      key: 'customPrice',
      label: 'Custom Price',
      children: unit.customPrice ? formatter.format(unit.customPrice) : <span style={{ color: token.colorTextDisabled }}>Default</span>,
    },
    { key: 'added', label: 'Added', children: dateFormatter.format(new Date(unit.createdAt)) },
  ]

  const saleItems = [
    {
      key: 'soldBy',
      label: 'Sold By',
      children: unit.soldAt ? (soldByUser?.name ?? 'Unknown') : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    {
      key: 'sold',
      label: 'Sold',
      children: unit.soldAt ? dateFormatter.format(new Date(unit.soldAt)) : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
  ]

  return (
    <div>
      <div className="ifix-table-panel" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          paddingLeft: 16,
          paddingRight: 10,
          boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>Unit Details</Typography.Text>
          {canEdit && (
            <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, padding: 16 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            {allPhotos.length > 0 ? (
              <Image.PreviewGroup
                preview={{
                  countRender: (current, total) => (
                    <span>{allPhotos[current - 1]?.label} · {current} / {total}</span>
                  ),
                  closeIcon: IMAGE_PREVIEW_CLOSE_ICON,
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 100px)',
                  gap: 10,
                  maxHeight: 220,
                  overflowY: 'auto',
                  paddingRight: allPhotos.length > 4 ? 10 : 0,
                }}>
                  {allPhotos.map((photo, i) => (
                    <Image
                      key={i}
                      src={photo.src}
                      alt={photo.label}
                      width={100}
                      height={100}
                      style={{
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: `0.5px solid ${token.colorBorderSecondary}`,
                        boxShadow: 'var(--ifix-panel-shadow)',
                      }}
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <div style={{
                width: 220,
                height: 220,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 8,
                border: `0.5px solid ${token.colorBorderSecondary}`,
                boxShadow: 'var(--ifix-panel-shadow)',
                background: token.colorFillQuaternary,
                color: iconColors.secondary,
              }}>
                <ImageOff size={20} strokeWidth={2.25} />
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>No photos</Typography.Text>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Typography.Text strong style={{ fontSize: 20 }}>{unit.imei}</Typography.Text>
              <UnitAvailabilityTag availability={unit.availability} />
            </div>
            <Descriptions
              column={2}
              bordered={false}
              layout="horizontal"
              items={detailItems}
              labelStyle={{ fontSize: 14 }}
              contentStyle={{ fontSize: 14 }}
            />
          </div>
        </div>
      </div>

      <div className="ifix-table-panel" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: 56,
          padding: '0 16px',
          boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>Sale Info</Typography.Text>
        </div>
        <div style={{ padding: 16 }}>
          <Descriptions
            column={2}
            bordered={false}
            layout="horizontal"
            items={saleItems}
            labelStyle={{ fontSize: 14 }}
            contentStyle={{ fontSize: 14 }}
          />
        </div>
      </div>

      <div className="ifix-table-panel">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: 56,
          padding: '0 16px',
          boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text strong style={{ fontSize: 15 }}>Notes</Typography.Text>
        </div>
        <div style={{ padding: 16, fontSize: 14, color: token.colorText }}>
          {unit.notes || <span style={{ color: token.colorTextDisabled }}>No notes</span>}
        </div>
      </div>

      <EditUnitModal
        open={editOpen}
        actor={user}
        product={product ?? null}
        unit={unit}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          setEditOpen(false)
          setVersion(v => v + 1)
          message.success('Unit updated')
        }}
      />
    </div>
  )
}

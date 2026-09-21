import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Image, Result, Typography, message, theme } from 'antd'
import { ImageOff, Pencil, Printer } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { canManageUnits, canPrintUnitCodes, canViewProducts, homePath } from '../../constants/roles'
import { GRADE_LABELS, TAX_LABELS } from '../../constants/products'
import { useIconColors } from '../../constants/iconColors'
import { IMAGE_PREVIEW_CLOSE_ICON } from '../../constants/imagePreviewIcons'
import { DetailDescriptions } from '../../components/DetailDescriptions'
import { UnitAvailabilityTag } from './components/UnitAvailabilityTag'
import { EditUnitModal } from './components/EditUnitModal'
import { PrintUnitLabelModal } from './components/PrintUnitLabelModal'

const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function UnitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [editOpen, setEditOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [thumbnailHovered, setThumbnailHovered] = useState(false)

  const unit = MOCK_PRODUCT_UNITS.find(u => u.id === id)
  void version

  if (!canViewProducts(user)) {
    return (
      <Result
        status="403"
        title="Not applicable"
        subTitle="Units are scoped to a merchant workspace. Super Admin operates at the platform level."
        extra={<Button onClick={() => navigate(homePath(user))}>Back home</Button>}
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
  const canPrint = canPrintUnitCodes(user)
  const soldByUser = unit.soldAt ? MOCK_USER_ACCOUNTS.find(a => a.id === unit.soldBy) : undefined

  const allPhotos = (unit.conditionPhotos ?? []).map((src, i) => ({ src, label: `Condition ${i + 1}` }))

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
    { key: 'imei1', label: 'IMEI 1', children: unit.imei1 ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { key: 'imei2', label: 'IMEI 2', children: unit.imei2 ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    { key: 'branch', label: 'Branch', children: unit.branch },
    { key: 'grade', label: 'Grade', children: unit.grade ? GRADE_LABELS[unit.grade] : <span style={{ color: token.colorTextDisabled }}>—</span> },
    {
      key: 'battery',
      label: 'Battery',
      children: unit.batteryPercentage != null
        ? `${unit.batteryPercentage}%`
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
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
      {/* Same page-header pattern as Products' catalog OverviewTab:
          title/tags on the left, actions on the right, no card chrome (see
          that file for why — antd dropped PageHeader from core in v5+, so
          this reproduces its layout by hand). The photo gallery shrinks to
          the same 40px thumbnail beside the title, with a hover "+N"
          overlay standing in for the full grid this panel used to show. */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}
              onMouseEnter={() => setThumbnailHovered(true)}
              onMouseLeave={() => setThumbnailHovered(false)}
            >
              {allPhotos.length > 0 ? (
                <Image.PreviewGroup
                  preview={{
                    countRender: (current, total) => (
                      <span>{allPhotos[current - 1]?.label} · {current} / {total}</span>
                    ),
                    closeIcon: IMAGE_PREVIEW_CLOSE_ICON,
                  }}
                >
                  <Image
                    src={allPhotos[0].src}
                    alt={allPhotos[0].label}
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover', borderRadius: token.borderRadiusSM, border: `0.5px solid ${token.colorBorderSecondary}` }}
                  />
                  {/* Rest of the photos join the same preview group (so the
                      thumbnail's click-to-preview cycles through all of them)
                      without rendering a second visible thumbnail. */}
                  {allPhotos.slice(1).map((photo, i) => (
                    <Image key={i} src={photo.src} alt="" style={{ display: 'none' }} />
                  ))}
                </Image.PreviewGroup>
              ) : (
                <div style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: token.borderRadiusSM,
                  border: `0.5px solid ${token.colorBorderSecondary}`,
                  background: token.colorFillQuaternary,
                  color: iconColors.secondary,
                }}>
                  <ImageOff size={16} strokeWidth={2.25} />
                </div>
              )}
              {allPhotos.length > 0 && thumbnailHovered && (
                // Same colorBgMask/colorTextLightSolid pairing antd's own
                // Image component uses for its hover-to-preview mask.
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: token.borderRadiusSM,
                  background: token.colorBgMask,
                  color: token.colorTextLightSolid,
                  fontSize: 12,
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}>
                  +{allPhotos.length}
                </div>
              )}
            </div>

            {/* Serial Number, not IMEI — it's the required primary identifier
                now that IMEI is optional and absent on laptops/accessories. */}
            <Typography.Title level={4} style={{ margin: 0 }}>{unit.serialNumber}</Typography.Title>
            <UnitAvailabilityTag availability={unit.availability} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canPrint && (
              <Button icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => setPrintOpen(true)}>Print label</Button>
            )}
            {canEdit && unit.availability !== 'sold' && (
              <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
            )}
          </div>
        </div>

        <DetailDescriptions items={detailItems} />
      </div>

      <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
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
          <DetailDescriptions items={saleItems} />
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

      <PrintUnitLabelModal
        open={printOpen}
        unit={unit}
        product={product ?? null}
        merchantId={user.merchantId}
        onClose={() => setPrintOpen(false)}
      />
    </div>
  )
}

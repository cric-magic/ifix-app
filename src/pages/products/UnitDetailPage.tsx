import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Image, Typography, message, theme } from 'antd'
import { ImageOff, Pencil, Printer, Lock, Smartphone, PackageOpen } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_USER_ACCOUNTS } from '../../constants/mockUsers'
import { canManageUnits, canPrintUnitCodes, canViewProducts, homePath } from '../../constants/roles'
import { GRADE_LABELS, TAX_LABELS } from '../../constants/products'
import { useIconColors } from '../../constants/iconColors'
import { IMAGE_PREVIEW_CLOSE_ICON } from '../../constants/imagePreviewIcons'
import { DetailDescriptions } from '../../components/DetailDescriptions'
import { DetailHeader } from '../../components/DetailHeader'
import { UnitAvailabilityTag } from './components/UnitAvailabilityTag'
import { EditUnitModal } from './components/EditUnitModal'
import { PrintUnitLabelModal } from './components/PrintUnitLabelModal'
import { UnitProductName } from './components/UnitProductName'
import { UnitPrice } from './components/UnitPrice'
import { ProductConditionTag } from './components/ProductConditionTag'
import { MarkOpenedModal } from './components/MarkOpenedModal'
import { canMarkOpened, fullSkuName } from '../../utils/product'
import { PageEmptyState } from '../../components/PageEmptyState'
import { MobileActionBar } from '../../components/MobileActionBar'
import { useIsMobile } from '../../components/useIsMobile'

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function UnitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const isMobile = useIsMobile()
  const [editOpen, setEditOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [markOpenedOpen, setMarkOpenedOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [thumbnailHovered, setThumbnailHovered] = useState(false)

  const unit = MOCK_PRODUCT_UNITS.find(u => u.id === id)
  void version

  if (!canViewProducts(user)) {
    return (
      <PageEmptyState
        icon={<Lock size={22} strokeWidth={2.25} />}
        title="Not applicable"
        description="Units are scoped to a merchant workspace. Super Admin operates at the platform level."
        action={<Button onClick={() => navigate(homePath(user))}>Back home</Button>}
      />
    )
  }

  if (!unit) {
    return (
      <PageEmptyState
        icon={<Smartphone size={22} strokeWidth={2.25} />}
        title="Unit not found"
        action={<Button onClick={() => navigate('/products/unit')}>Back to list</Button>}
      />
    )
  }

  const product = MOCK_PRODUCTS.find(p => p.id === unit.productId)
  const canEdit = canManageUnits(user)
  const canPrint = canPrintUnitCodes(user)
  const canEditUnit = canEdit && unit.availability !== 'sold'
  const canOpen = canEdit && canMarkOpened(unit, product)
  const soldByUser = unit.soldAt ? MOCK_USER_ACCOUNTS.find(a => a.id === unit.soldBy) : undefined

  const allPhotos = (unit.conditionPhotos ?? []).map((src, i) => ({ src, label: `Condition ${i + 1}` }))

  const detailItems = [
    {
      key: 'product',
      label: 'Product',
      children: <UnitProductName product={product} color={token.colorText} />,
    },
    {
      key: 'condition',
      label: 'Condition',
      children: product
        ? <ProductConditionTag type={product.type} />
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    { key: 'serialNumber', label: 'Serial Number', children: unit.serialNumber },
    {
      key: 'modelNumber',
      label: 'Model Number',
      children: unit.modelNumber ?? product?.modelNumber ?? <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
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
      key: 'price',
      label: 'Price',
      children: <UnitPrice unit={unit} product={product} />,
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
      {/* The photo gallery shrinks to the same 40px thumbnail beside the
          title, with a hover "+N" overlay standing in for the full grid this
          panel used to show. On mobile the actions move to the bottom bar. */}
      <div style={{ marginBottom: 24 }}>
        <DetailHeader
          leading={(
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
          )}
          // Serial Number, not IMEI — it's the required primary identifier
          // now that IMEI is optional and absent on laptops/accessories.
          title={unit.serialNumber}
          tags={<UnitAvailabilityTag availability={unit.availability} />}
          actions={(canPrint || canEditUnit) && (
            <>
              {canOpen && (
                <Button icon={<PackageOpen size={16} strokeWidth={2.25} />} onClick={() => setMarkOpenedOpen(true)}>Mark as Opened</Button>
              )}
              {canPrint && (
                <Button icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => setPrintOpen(true)}>Print label</Button>
              )}
              {canEditUnit && (
                <Button icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
              )}
            </>
          )}
        />

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

      {/* Mobile: Edit in the bottom bar, Print label behind "…" — or Print
          label itself for someone who can't edit (or once it's sold). */}
      {isMobile && (canPrint || canEditUnit) && (
        <MobileActionBar
          more={[
            ...(canOpen ? [{ key: 'mark-opened', label: 'Mark as Opened', icon: <PackageOpen size={16} strokeWidth={2.25} />, onClick: () => setMarkOpenedOpen(true) }] : []),
            ...(canEditUnit && canPrint ? [{ key: 'print', label: 'Print label', icon: <Printer size={16} strokeWidth={2.25} />, onClick: () => setPrintOpen(true) }] : []),
          ]}
        >
          {canEditUnit ? (
            <Button type="primary" icon={<Pencil size={16} strokeWidth={2.25} />} onClick={() => setEditOpen(true)}>Edit</Button>
          ) : (
            <Button type="primary" icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => setPrintOpen(true)}>Print label</Button>
          )}
        </MobileActionBar>
      )}

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

      <MarkOpenedModal
        actor={user}
        unit={markOpenedOpen ? unit : null}
        product={markOpenedOpen ? product ?? null : null}
        onClose={() => setMarkOpenedOpen(false)}
        onMoved={opened => {
          setMarkOpenedOpen(false)
          setVersion(v => v + 1)
          message.success(`Moved to ${fullSkuName(opened)}`)
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

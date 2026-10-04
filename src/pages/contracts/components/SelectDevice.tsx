import { useState } from 'react'
import { Alert, AutoComplete, Button, Col, Form, Input, Row, Segmented, Tag, Typography, theme } from 'antd'
import { ScanLine, Search } from 'lucide-react'
import { Select } from '../../../components/AppSelect'
import { useIconColors } from '../../../constants/iconColors'
import { useIsMobile } from '../../../components/useIsMobile'
import { MOCK_PRODUCTS } from '../../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { MOCK_CONTRACTS } from '../../../constants/mockContracts'
import { scopedAllUnits, scopedProductList } from '../../../constants/roles'
import { unitConditionLabel } from '../../../utils/product'
import type { AuthUser } from '../../../types/installment'
import type { Product, ProductUnit } from '../../../types/product'

// How the unit was picked — decides whether Fill Device Info arrives with the
// IMEI and Serial Number already filled (IMEI Search) or asks for them to be
// entered and matched against the unit (Guided Browse).
export type DeviceSource = 'browse' | 'imei'

export interface DeviceChoice {
  unitId: string
  productId: string
  source: DeviceSource
}

interface Props {
  actor: AuthUser
  // The branch the contract belongs to — only its available units can be
  // picked.
  branch: string
  value: DeviceChoice | null
  onChange: (choice: DeviceChoice | null) => void
  // Editing: the contract's own unit, reserved by that same contract, still
  // counts as available to pick.
  currentUnitId?: string
}

const priceFormatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

// Where an IMEI search stops: a full IMEI is 15 digits.
const IMEI_LENGTH = 15
// Typed digits before matching units are suggested.
const MIN_QUERY = 3

// Step 2 of the Contract Creation Flow, per the Contract doc — two ways to
// pick the unit:
// - Guided Browse (new inventory): Brand → Model → Storage → Color, then an
//   available unit. Every choice only offers what leads to a unit available
//   at this branch, so the path never dead-ends.
// - IMEI Search (used inventory, or a fast lookup with the box in hand):
//   type or scan the IMEI; matching units are suggested as you type, and
//   picking one fills in the rest. A unit that can't be used — not found,
//   Reserved, Sold, or at another branch — says why, with a way back to
//   browsing.
// Either way the picked unit is summarised underneath.
export function SelectDevice({ actor, branch, value, onChange, currentUnitId }: Props) {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<DeviceSource>(value?.source ?? 'browse')

  const products = scopedProductList(actor, MOCK_PRODUCTS)
  const productById = new Map(MOCK_PRODUCTS.map(p => [p.id, p]))
  const isPickable = (u: ProductUnit) =>
    u.branch === branch && (u.availability === 'available' || u.id === currentUnitId)

  const selectedUnit = value ? MOCK_PRODUCT_UNITS.find(u => u.id === value.unitId) : undefined
  const selectedProduct = selectedUnit ? productById.get(selectedUnit.productId) : undefined

  return (
    <div>
      <Segmented<DeviceSource>
        block={isMobile}
        value={mode}
        onChange={next => setMode(next)}
        options={[
          { value: 'browse', label: 'Browse by model' },
          { value: 'imei', label: 'Search by IMEI' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {mode === 'browse' ? (
        <GuidedBrowse
          products={products}
          isPickable={isPickable}
          value={value?.source === 'browse' ? value : null}
          onChange={onChange}
        />
      ) : (
        <ImeiSearch
          actor={actor}
          branch={branch}
          isPickable={isPickable}
          productById={productById}
          onChange={onChange}
          onBrowse={() => setMode('browse')}
        />
      )}

      {selectedUnit && selectedProduct && value?.source === mode && (
        <SelectedUnit unit={selectedUnit} product={selectedProduct} source={value.source} />
      )}
    </div>
  )
}

function GuidedBrowse({ products, isPickable, value, onChange }: {
  products: Product[]
  isPickable: (u: ProductUnit) => boolean
  value: DeviceChoice | null
  onChange: (choice: DeviceChoice | null) => void
}) {
  const initial = value ? products.find(p => p.id === value.productId) : undefined
  const [brand, setBrand] = useState<string | undefined>(initial?.brand)
  const [model, setModel] = useState<string | undefined>(initial?.model)
  const [storage, setStorage] = useState<string | undefined>(initial?.storage)
  const [color, setColor] = useState<string | undefined>(initial?.color)

  // Only products with a unit available at this branch — so every option
  // at every step leads somewhere.
  const stockOf = (p: Product) => MOCK_PRODUCT_UNITS.filter(u => u.productId === p.id && isPickable(u))
  const inStock = products.filter(p => stockOf(p).length > 0)

  const uniq = (values: (string | undefined)[]) => [...new Set(values.filter((v): v is string => !!v))]
  const brands = uniq(inStock.map(p => p.brand)).sort()
  const byBrand = inStock.filter(p => p.brand === brand)
  const models = uniq(byBrand.map(p => p.model)).sort()
  const byModel = byBrand.filter(p => p.model === model)
  // Storage is skipped for a model with no storage variants (accessories).
  const storages = uniq(byModel.map(p => p.storage))
  const needsStorage = storages.length > 0
  const byStorage = needsStorage ? byModel.filter(p => p.storage === storage) : byModel
  const colors = uniq(byStorage.map(p => p.color)).sort()
  const byColor = byStorage.filter(p => p.color === color)
  // New and used products can share a model, storage and color — their
  // units list together, each labelled with its condition.
  const units = byColor.flatMap(p => stockOf(p).map(u => ({ unit: u, product: p })))
  const countLabel = (list: Product[]) => {
    const n = list.reduce((sum, p) => sum + stockOf(p).length, 0)
    return `${n} available`
  }

  function pick(next: { brand?: string; model?: string; storage?: string; color?: string }) {
    setBrand(next.brand)
    setModel(next.model)
    setStorage(next.storage)
    setColor(next.color)
    onChange(null)
  }

  const option = (label: string, list: Product[]) => ({
    value: label,
    label: (
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{label}</span>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{countLabel(list)}</Typography.Text>
      </span>
    ),
  })

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item required label="Brand">
            <Select
              placeholder="Select brand"
              value={brand}
              onChange={b => pick({ brand: b })}
              options={brands.map(b => option(b, inStock.filter(p => p.brand === b)))}
              optionLabelProp="value"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item required label="Model">
            <Select
              placeholder={brand ? 'Select model' : 'Select a brand first'}
              disabled={!brand}
              value={model}
              onChange={m => pick({ brand, model: m })}
              options={models.map(m => option(m, byBrand.filter(p => p.model === m)))}
              optionLabelProp="value"
            />
          </Form.Item>
        </Col>
        {(!model || needsStorage) && (
          <Col span={12}>
            <Form.Item required label="Storage">
              <Select
                placeholder={model ? 'Select storage' : 'Select a model first'}
                disabled={!model}
                value={storage}
                onChange={st => pick({ brand, model, storage: st })}
                options={storages.map(st => option(st, byModel.filter(p => p.storage === st)))}
                optionLabelProp="value"
              />
            </Form.Item>
          </Col>
        )}
        <Col span={12}>
          <Form.Item required label="Color">
            <Select
              placeholder={(needsStorage ? storage : model) ? 'Select color' : `Select ${needsStorage || !model ? 'storage' : 'a model'} first`}
              disabled={needsStorage ? !storage : !model}
              value={color}
              onChange={c => pick({ brand, model, storage, color: c })}
              options={colors.map(c => option(c, byStorage.filter(p => p.color === c)))}
              optionLabelProp="value"
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item required label="Unit">
        <Select
          placeholder={color ? 'Select an available unit' : 'Select a color first'}
          disabled={!color}
          value={value?.unitId}
          onChange={unitId => {
            const hit = units.find(u => u.unit.id === unitId)
            if (hit) onChange({ unitId, productId: hit.product.id, source: 'browse' })
          }}
          options={units.map(({ unit, product }) => ({
            value: unit.id,
            label: `${unit.serialNumber} · ${unitConditionLabel(unit, product)} · ${priceFormatter.format(unit.customPrice ?? product.salesPrice)}`,
          }))}
        />
      </Form.Item>
      {inStock.length === 0 && (
        <Alert type="warning" showIcon message="No units are available at this branch." style={{ marginBottom: 16 }} />
      )}
    </>
  )
}

// Why a unit found by IMEI can't be picked, or null if it can.
function unavailableReason(unit: ProductUnit, branch: string, isPickable: (u: ProductUnit) => boolean): string | null {
  if (isPickable(unit)) return null
  if (unit.availability === 'sold') return 'Sold'
  if (unit.availability === 'reserved') {
    const contract = MOCK_CONTRACTS.find(c => c.device.unitId === unit.id)
    return contract ? `Reserved for ${contract.contractNumber}` : 'Reserved'
  }
  if (unit.branch !== branch) return `At ${unit.branch}`
  return 'Unavailable'
}

function ImeiSearch({ actor, branch, isPickable, productById, onChange, onBrowse }: {
  actor: AuthUser
  branch: string
  isPickable: (u: ProductUnit) => boolean
  productById: Map<string, Product>
  onChange: (choice: DeviceChoice | null) => void
  onBrowse: () => void
}) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [query, setQuery] = useState('')
  const digits = query.replace(/\D/g, '')

  // Every unit in scope with an IMEI starting with what's typed — including
  // ones that can't be picked, so a scan of a taken unit says why rather
  // than just finding nothing.
  const units = scopedAllUnits(actor, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS)
  const matches = digits.length >= MIN_QUERY
    ? units.filter(u => u.imei1?.startsWith(digits) || u.imei2?.startsWith(digits)).slice(0, 8)
    : []
  const exact = digits.length === IMEI_LENGTH
    ? units.find(u => u.imei1 === digits || u.imei2 === digits)
    : undefined
  const exactReason = exact ? unavailableReason(exact, branch, isPickable) : null
  const notFound = digits.length === IMEI_LENGTH && !exact

  // A full, exact IMEI of an available unit picks it — typed or scanned in
  // full, or filled in by choosing a suggestion.
  function onType(text: string) {
    setQuery(text)
    const typed = text.replace(/\D/g, '')
    const hit = typed.length === IMEI_LENGTH ? units.find(u => u.imei1 === typed || u.imei2 === typed) : undefined
    if (hit && isPickable(hit)) onChange({ unitId: hit.id, productId: hit.productId, source: 'imei' })
    else onChange(null)
  }

  return (
    <>
      <Form.Item required label="IMEI" extra="Type or scan the IMEI — matching units appear as you type.">
        <AutoComplete
          value={query}
          onChange={onType}
          style={{ width: '100%' }}
          options={matches.map(u => {
            const product = productById.get(u.productId)
            const reason = unavailableReason(u, branch, isPickable)
            // The IMEI itself is the option's value — picking a suggestion
            // fills it in, which selects the unit (onType).
            return {
              value: (u.imei1?.startsWith(digits) ? u.imei1 : u.imei2) ?? u.id,
              disabled: !!reason,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: token.fontFamilyCode }}>{u.imei1?.startsWith(digits) ? u.imei1 : u.imei2}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                      {product ? `${product.name}${product.storage ? ` · ${product.storage}` : ''} · ${product.color}` : '—'} · {unitConditionLabel(u, product)}
                    </Typography.Text>
                  </div>
                  {reason && <Tag style={{ margin: 0, flexShrink: 0 }}>{reason}</Tag>}
                </div>
              ),
            }
          })}
        >
          <Input
            inputMode="numeric"
            maxLength={IMEI_LENGTH}
            placeholder="e.g. 352417000000017"
            prefix={<ScanLine size={16} strokeWidth={2.25} color={iconColors.secondary} />}
            allowClear
          />
        </AutoComplete>
      </Form.Item>

      {/* The fallback states: nothing has this IMEI, or the unit that does
          can't go on this contract — each with the way forward. */}
      {notFound && (
        <Alert
          type="warning"
          showIcon
          message="No unit with this IMEI"
          description={`Nothing in ${branch}'s inventory has IMEI ${digits}. Check the digits against the box label, or find the unit by model instead.`}
          action={<Button size="small" icon={<Search size={16} strokeWidth={2.25} />} onClick={onBrowse}>Browse by model</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      {exact && exactReason && (
        <Alert
          type="error"
          showIcon
          message={`This unit can't be used — ${exactReason.charAt(0).toLowerCase()}${exactReason.slice(1)}`}
          description={
            exact.availability === 'sold'
              ? 'It has already been sold. Pick another unit.'
              : exact.availability === 'reserved'
                ? 'It is held by another contract. Pick another unit.'
                : `Contracts can only use units at ${branch}. Pick a unit from this branch.`
          }
          action={<Button size="small" icon={<Search size={16} strokeWidth={2.25} />} onClick={onBrowse}>Browse by model</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
    </>
  )
}

// The picked unit, summarised under either path — what the contract will
// use, and (from IMEI Search) everything that was filled in from the scan.
function SelectedUnit({ unit, product, source }: { unit: ProductUnit; product: Product; source: DeviceSource }) {
  const { token } = theme.useToken()
  const rows: [string, string][] = [
    ['Model', `${product.brand} ${product.model}`],
    ...(product.storage ? [['Storage', product.storage] as [string, string]] : []),
    ['Color', product.color],
    ['Condition', unitConditionLabel(unit, product)],
    ['Serial Number', unit.serialNumber],
    ...(unit.imei1 ? [['IMEI', unit.imei1] as [string, string]] : []),
    ['Price', priceFormatter.format(unit.customPrice ?? product.salesPrice)],
  ]
  return (
    <div style={{ background: token.colorFillQuaternary, borderRadius: token.borderRadiusLG, padding: 16, marginBottom: 16 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        {source === 'imei' ? 'Unit found' : 'Selected unit'}
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 16, rowGap: 4 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <Typography.Text type="secondary">{label}</Typography.Text>
            <Typography.Text style={{ textAlign: 'right' }}>{value}</Typography.Text>
          </div>
        ))}
      </div>
    </div>
  )
}

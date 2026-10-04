import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Alert, Avatar, Button, Drawer, Input, Modal, Tag, Typography, theme } from 'antd'
import { ImageOff, X } from 'lucide-react'
import { MobileTableRow } from '../../components/MobileTableRow'
import { DotTag } from '../../components/DotTag'
import { useIsMobile } from '../../components/useIsMobile'
import { useAppWindowContainer } from '../../contexts/AppWindowContext'
import { useIconColors } from '../../constants/iconColors'
import { MOCK_PRODUCTS } from '../../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../../constants/mockProductUnits'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { scopedAllUnits, scopedProductList } from '../../constants/roles'
import { defaultTemplateOf, financingFor, selectableTemplatesFor, termsOf } from '../../utils/quote'
import { UNIT_NUMBER_LENGTH, codeMatching, findUnitByCode, fullSkuName, unitPrice, variantOf } from '../../utils/product'
import type { AuthUser } from '../../types/installment'
import type { Product, ProductUnit, UnitAvailability } from '../../types/product'
import { conditionLabel, conditionOf, groupByModel, type Condition } from './models'
import { QuoteView } from './QuoteView'

const priceFormatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

const IMEI_LENGTH = 15
// Typed digits before IMEI matches are suggested.
const MIN_IMEI_QUERY = 3

// One row of results: units alike in SKU, branch, price, condition and
// availability.
interface UnitRow {
  key: string
  product: Product
  branch: string
  price: number
  condition: Condition
  availability: UnitAvailability
  units: ProductUnit[]
}

interface Props {
  open: boolean
  actor: AuthUser
  onClose: () => void
}

// Price Check: "do you have it, and how much a month?" — answered from
// anywhere in the app, without starting a contract or leaving the page
// you're on. Opened from the sidebar.
//
// One screen, like a command palette: the search box on top, and under it
// the stock itself, a row per kind of unit — name, branch, price and status
// (see unitRows) — or single units, when the text is an IMEI or a unit ID.
// Picking one swaps the list for its quote (the selling price and the
// monthly), and Start contract carries that unit into a new contract;
// typing again brings the list back, so "and the Pro?" is just another
// search.
// A desktop modal; a full-screen sheet on mobile, like the app's other
// drawers there.
export function PriceCheckModal({ open, actor, onClose }: Props) {
  const isMobile = useIsMobile()
  const appWindow = useAppWindowContainer()

  // Fresh each time it opens — a quick check starts from an empty box.
  const content = open ? <PriceCheckContent actor={actor} onDone={onClose} /> : null

  // No title bar on either: the search field is the header (with its own
  // close button), the way a command palette's is.
  return isMobile ? (
    <Drawer
      open={open}
      title={null}
      closable={false}
      onClose={onClose}
      rootClassName="ifix-price-check-sheet"
      destroyOnHidden
      getContainer={appWindow ?? undefined}
    >
      {content}
    </Drawer>
  ) : (
    // Inside the app window (like every drawer), so in the desktop stage it
    // centres on the app rather than on the whole browser.
    // Never taller than the app window: the search stays pinned at the top
    // and the quote's answer at the bottom, and only what's between scrolls
    // (see .ifix-price-check-modal in index.css).
    <Modal
      open={open}
      title={null}
      closable={false}
      aria-label="Price check"
      onCancel={onClose}
      footer={null}
      width={520}
      style={{ top: 48 }}
      rootClassName="ifix-price-check-modal"
      destroyOnHidden
      getContainer={appWindow ?? undefined}
    >
      {content}
    </Modal>
  )
}

function PriceCheckContent({ actor, onDone }: { actor: AuthUser; onDone: () => void }) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()

  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<{ modelKey: string; unitId?: string } | null>(null)

  const defaultTemplate = defaultTemplateOf(selectableTemplatesFor(actor))
  const longestTerm = defaultTemplate ? termsOf(defaultTemplate).at(-1) : undefined

  const scopedUnits = useMemo(() => scopedAllUnits(actor, MOCK_PRODUCT_UNITS, MOCK_PRODUCTS), [actor])
  const availableUnits = scopedUnits.filter(u => u.availability === 'available')
  const models = useMemo(
    () => groupByModel(scopedProductList(actor, MOCK_PRODUCTS).filter(p => p.status === 'available')),
    [actor],
  )
  const modelOf = (u: ProductUnit) => {
    const p = MOCK_PRODUCTS.find(x => x.id === u.productId)!
    return { product: p, key: `${p.brand}|${p.model}` }
  }

  const query = search.trim().toLowerCase()
  const digits = /^\d+$/.test(query) ? query : ''

  // --- Suggestions ------------------------------------------------------

  // Units grouped into rows: one per SKU, branch, price and condition (a
  // Used unit's grade), and availability — so two units that would be
  // quoted alike share a row with a count, and any difference in price or
  // condition gets a row of its own. Available and Reserved both show (a
  // reserved one says which contract holds it, and can't be picked); Sold
  // units are gone from stock and left out.
  const unitRows = useMemo(() => {
    const rows = new Map<string, UnitRow>()
    for (const unit of scopedUnits) {
      if (unit.availability === 'sold') continue
      const product = MOCK_PRODUCTS.find(p => p.id === unit.productId)
      if (!product || product.deletedAt || product.status !== 'available') continue
      const price = unitPrice(unit, product)
      const condition = conditionOf(unit, product)
      // Each reserved unit is held by its own contract, so its own row.
      const key = unit.availability === 'reserved'
        ? unit.id
        : [product.id, unit.branch, price, condition].join('|')
      const row = rows.get(key)
      if (row) row.units.push(unit)
      else rows.set(key, { key, product, branch: unit.branch, price, condition, availability: unit.availability, units: [unit] })
    }
    return [...rows.values()]
  }, [scopedUnits])

  const monthlyFor = (price: number) => defaultTemplate && longestTerm?.ratePercent != null
    // The lowest monthly the default template reaches: its smallest down
    // payment over its longest term — the "from ฿X/mo" customers ask for.
    ? financingFor(price, defaultTemplate.minDownPaymentPercent, longestTerm.ratePercent, longestTerm.months).installmentAmount
    : undefined

  const rowOptions = unitRows
    .filter(row => {
      if (!query || digits) return !digits
      const p = row.product
      const text = [p.brand, p.model, p.name, p.storage, p.color, p.sku, fullSkuName(p), conditionLabel(row.condition), row.branch]
        .join(' ').toLowerCase()
      return query.split(/\s+/).every(word => text.includes(word))
    })
    // The viewer's own branch first, sellable before reserved, then by
    // product and price.
    .sort((a, b) =>
      Number(b.branch === actor.branch) - Number(a.branch === actor.branch)
      || Number(a.availability !== 'available') - Number(b.availability !== 'available')
      || fullSkuName(a.product).localeCompare(fullSkuName(b.product))
      || a.price - b.price
      || a.branch.localeCompare(b.branch))

  // Part of an IMEI: the units it could be, whatever their state — one
  // that can't be sold says why rather than going missing.
  const imeiOptions = digits.length >= MIN_IMEI_QUERY
    ? scopedUnits.filter(u => codeMatching(u, digits)).slice(0, 8)
    : []

  function unavailableReason(u: ProductUnit) {
    if (u.availability === 'sold') return 'Sold'
    if (u.availability === 'reserved') {
      const holder = MOCK_CONTRACTS.find(c => c.device.unitId === u.id)
      return holder ? `Reserved for ${holder.contractNumber}` : 'Reserved'
    }
    return undefined
  }

  const thumbnail = (product: Product) => (
    // 44px, the height of the row's two lines together (the list rows'
    // own size, see MobileTableRow) — at 36 it floated small beside them.
    <Avatar
      shape="square"
      size={44}
      src={product.photos?.[0]}
      icon={<ImageOff size={16} strokeWidth={2.25} />}
      style={{ backgroundColor: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
    />
  )

  // The results, as the modal's own content rather than a dropdown: the
  // list is what the modal is for until something is picked.
  const items: { key: string; disabled?: boolean; content: ReactNode; pick: () => void }[] = digits
    ? imeiOptions.map(u => {
        const { product } = modelOf(u)
        const reason = unavailableReason(u)
        const imei = codeMatching(u, digits)!
        return {
          key: u.id,
          disabled: !!reason,
          pick: () => pickUnit(u, imei),
          content: (
            <MobileTableRow
              primary={imei}
              trailing={reason ? <Tag style={{ margin: 0 }}>{reason}</Tag> : undefined}
              secondary={[product.model, variantOf(product), conditionLabel(conditionOf(u, product)), u.branch].filter(Boolean).join(' · ')}
            />
          ),
        }
      })
    : rowOptions.map(row => {
        const reserved = row.availability === 'reserved'
        const monthly = monthlyFor(row.price)
        // Name, then condition where the name doesn't say it all (a Used
        // unit's grade); branch and, for a reserved unit, what holds it.
        const name = row.product.type === 'used'
          ? `${fullSkuName(row.product)} · ${conditionLabel(row.condition).replace(/^Used · /, '')}`
          : fullSkuName(row.product)
        return {
          key: row.key,
          disabled: reserved,
          pick: () => pickUnit(row.units[0], fullSkuName(row.product)),
          content: (
            <MobileTableRow
              leading={thumbnail(row.product)}
              primary={name}
              trailing={reserved
                ? <DotTag dotColor={token.colorWarning} textColor={token.colorTextTertiary}>Reserved</DotTag>
                : <DotTag dotColor={token.colorSuccess}>{row.units.length > 1 ? `Available · ${row.units.length}` : 'Available'}</DotTag>}
              secondary={reserved
                ? `${row.branch} · ${unavailableReason(row.units[0])}`
                : `${row.branch}${monthly != null ? ` · from ${priceFormatter.format(monthly)}/mo` : ''}`}
              trailingSecondary={<span style={{ color: reserved ? token.colorTextTertiary : token.colorText, fontWeight: 600 }}>{priceFormatter.format(row.price)}</span>}
            />
          ),
        }
      })

  // --- Picking ----------------------------------------------------------

  // The modal body (or mobile sheet) scrolls as one, so swapping the list
  // for a quote — or back — starts the new content at its top rather than
  // wherever the old one was scrolled to.
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollToTop = () => rootRef.current?.closest('.ant-modal-body, .ant-drawer-body')?.scrollTo({ top: 0 })

  function pickUnit(unit: ProductUnit, text: string) {
    scrollToTop()
    setPicked({ modelKey: modelOf(unit).key, unitId: unit.id })
    setSearch(text)
  }

  // Typing again goes back to the results — "and the Pro?" is a new
  // search, not a back button. A full IMEI of a sellable unit picks it
  // straight away: scanning needs no second step.
  function handleChange(text: string) {
    if (picked) scrollToTop()
    setSearch(text)
    setPicked(null)
    setActive(0)
    // A full code from a sticker or a box — the Internal Unit ID, an IMEI or
    // a Serial Number — picks its unit outright.
    const unit = findUnitByCode(text, availableUnits)
    if (unit) pickUnit(unit, text.trim())
  }

  // Arrow keys move through the results and Enter picks, so the keyboard
  // (or a scanner's Enter) never has to reach for the mouse.
  const [active, setActive] = useState(0)
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (picked || !items.length) return
    const step = (from: number, by: number) => {
      for (let i = 1; i <= items.length; i++) {
        const next = (from + by * i + items.length) % items.length
        if (!items[next].disabled) return next
      }
      return from
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => step(a, 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => step(a, -1)) }
    if (e.key === 'Enter' && !items[active]?.disabled) { e.preventDefault(); items[active]?.pick() }
  }

  const imeiNotFound = (digits.length === IMEI_LENGTH || digits.length === UNIT_NUMBER_LENGTH) && !findUnitByCode(digits, scopedUnits) && !scopedUnits.some(u => codeMatching(u, digits))
  const pickedGroup = models.find(g => g.key === picked?.modelKey)
  const pickedIds = new Set(pickedGroup?.products.map(p => p.id))

  return (
    <div ref={rootRef}>
      {/* The header is the search itself: a borderless field with the
          close button beside it, over a hairline running edge to edge.
          Pinned while the results or options scroll under it. */}
      <div className="ifix-price-check-header" style={{ background: token.colorBgElevated, borderBottom: `0.5px solid ${token.colorSplit}` }}>
        <Input
          size="large"
          variant="borderless"
          autoFocus
          allowClear
          aria-label="Search a model, or scan a barcode or IMEI"
          value={search}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a model, or scan a barcode or IMEI"
          style={{ flex: 1, paddingInline: 0 }}
        />
        <Button type="text" size="small" aria-label="Close" icon={<X size={16} strokeWidth={2.25} />} onClick={onDone} style={{ borderRadius: 6, flexShrink: 0 }} />
      </div>

      {imeiNotFound && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={`No unit with this ${digits.length === UNIT_NUMBER_LENGTH ? 'unit ID' : 'IMEI'}${actor.branch ? ` at ${actor.branch}` : ''}. Check the digits against the label, or search the model instead.`}
        />
      )}

      {pickedGroup ? (
        <div style={{ marginTop: 16 }}>
          <QuoteView
            actor={actor}
            group={pickedGroup}
            units={availableUnits.filter(u => pickedIds.has(u.productId))}
            preferredBranch={actor.branch}
            matchedUnitId={picked?.unitId}
            onStarted={onDone}
          />
        </div>
      ) : !imeiNotFound && (
        items.length ? (
          <div role="listbox" className="ifix-price-check-results">
            {items.map((item, index) => (
              <button
                key={item.key}
                type="button"
                role="option"
                aria-selected={index === active}
                disabled={item.disabled}
                className="ifix-price-check-item"
                data-active={index === active || undefined}
                onMouseEnter={() => !item.disabled && setActive(index)}
                onClick={item.pick}
              >
                {item.content}
              </button>
            ))}
          </div>
        ) : (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16, textAlign: 'center' }}>
            {digits ? 'No units match these digits yet.' : 'No units match. Try a brand, model, color or branch, or scan the barcode.'}
          </Typography.Text>
        )
      )}
    </div>
  )
}


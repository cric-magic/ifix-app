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
import { unitPrice, variantOf } from '../../utils/product'
import type { AuthUser } from '../../types/installment'
import type { ProductUnit } from '../../types/product'
import { conditionLabel, conditionOf, groupByModel, type ModelGroup } from './models'
import { QuoteView } from './QuoteView'

const priceFormatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

const IMEI_LENGTH = 15
// Typed digits before IMEI matches are suggested.
const MIN_IMEI_QUERY = 3

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
// the models (with stock and "from" prices) — or units, when the text is an
// IMEI. Picking one swaps the list for its quote; typing again brings the
// list back, so "and the Pro?" is just another search.
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

  const stockOf = (group: ModelGroup) => {
    const ids = new Set(group.products.map(p => p.id))
    return availableUnits.filter(u => ids.has(u.productId))
  }

  const modelOptions = models
    .filter(group => {
      if (!query || digits) return !digits
      const text = group.products.flatMap(p => [p.brand, p.model, p.name, p.storage, p.color, p.sku]).join(' ').toLowerCase()
      return query.split(/\s+/).every(word => text.includes(word))
    })
    .map(group => {
      const units = stockOf(group)
      const prices = units.length
        ? units.map(u => unitPrice(u, group.products.find(p => p.id === u.productId)!))
        : group.products.map(p => p.salesPrice)
      const priceFrom = Math.min(...prices)
      // The lowest monthly the default template reaches: its smallest down
      // payment over its longest term — the "from ฿X/mo" customers ask for.
      const monthlyFrom = defaultTemplate && longestTerm?.ratePercent != null
        ? financingFor(priceFrom, defaultTemplate.minDownPaymentPercent, longestTerm.ratePercent, longestTerm.months).installmentAmount
        : undefined
      return { group, stock: units.length, priceFrom, monthlyFrom }
    })
    // In stock first, then by brand and model.
    .sort((a, b) =>
      Number(b.stock > 0) - Number(a.stock > 0)
      || a.group.brand.localeCompare(b.group.brand)
      || a.group.model.localeCompare(b.group.model))

  // Part of an IMEI: the units it could be, whatever their state — one
  // that can't be sold says why rather than going missing.
  const imeiOptions = digits.length >= MIN_IMEI_QUERY
    ? scopedUnits.filter(u => [u.imei1, u.imei2].some(i => i?.startsWith(digits))).slice(0, 8)
    : []

  const unavailableReason = (u: ProductUnit) => {
    if (u.availability === 'sold') return 'Sold'
    if (u.availability === 'reserved') {
      const holder = MOCK_CONTRACTS.find(c => c.device.unitId === u.id)
      return holder ? `Reserved for ${holder.contractNumber}` : 'Reserved'
    }
    return undefined
  }

  const thumbnail = (group: ModelGroup) => (
    // 44px, the height of the row's two lines together (the list rows'
    // own size, see MobileTableRow) — at 36 it floated small beside them.
    <Avatar
      shape="square"
      size={44}
      src={group.products.find(p => p.photos?.length)?.photos?.[0]}
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
        const imei = [u.imei1, u.imei2].find(i => i?.startsWith(digits))!
        return {
          key: u.id,
          disabled: !!reason,
          pick: () => pickUnit(u, imei),
          content: (
            <MobileTableRow
              primary={imei}
              trailing={reason ? <Tag style={{ margin: 0 }}>{reason}</Tag> : undefined}
              secondary={[product.model, variantOf(product), conditionLabel(conditionOf(u)), u.branch].filter(Boolean).join(' · ')}
            />
          ),
        }
      })
    : modelOptions.map(r => ({
        key: r.group.key,
        pick: () => pickModel(r.group),
        content: (
          <MobileTableRow
            leading={thumbnail(r.group)}
            primary={r.group.model}
            trailing={r.stock > 0
              ? <DotTag dotColor={token.colorSuccess}>{r.stock} in stock</DotTag>
              : <DotTag dotColor={token.colorTextQuaternary} textColor={token.colorTextTertiary}>Out of stock</DotTag>}
            secondary={`${r.group.brand} · from ${priceFormatter.format(r.priceFrom)}`}
            trailingSecondary={r.monthlyFrom != null ? `${priceFormatter.format(r.monthlyFrom)}/mo` : undefined}
          />
        ),
      }))

  // --- Picking ----------------------------------------------------------

  // The modal body (or mobile sheet) scrolls as one, so swapping the list
  // for a quote — or back — starts the new content at its top rather than
  // wherever the old one was scrolled to.
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollToTop = () => rootRef.current?.closest('.ant-modal-body, .ant-drawer-body')?.scrollTo({ top: 0 })

  function pickModel(group: ModelGroup) {
    scrollToTop()
    setPicked({ modelKey: group.key })
    setSearch(group.model)
  }

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
    const typed = text.trim()
    if (typed.length !== IMEI_LENGTH || !/^\d+$/.test(typed)) return
    const unit = availableUnits.find(u => u.imei1 === typed || u.imei2 === typed)
    if (unit) pickUnit(unit, typed)
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

  const imeiNotFound = digits.length === IMEI_LENGTH && !scopedUnits.some(u => u.imei1 === digits || u.imei2 === digits)
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
          aria-label="Search a model, or scan an IMEI"
          value={search}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a model, or scan an IMEI"
          style={{ flex: 1, paddingInline: 0 }}
        />
        <Button type="text" size="small" aria-label="Close" icon={<X size={16} strokeWidth={2.25} />} onClick={onDone} style={{ borderRadius: 6, flexShrink: 0 }} />
      </div>

      {imeiNotFound && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={`No unit with this IMEI${actor.branch ? ` at ${actor.branch}` : ''}. Check the digits against the box label, or search the model instead.`}
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
            {digits ? 'No units match these digits yet.' : 'No models match. Try a brand, or scan the IMEI.'}
          </Typography.Text>
        )
      )}
    </div>
  )
}


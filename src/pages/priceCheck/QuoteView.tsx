import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Typography, theme } from 'antd'
import { FileText } from 'lucide-react'
import { Select } from '../../components/AppSelect'
import { DownPaymentField } from '../../components/DownPaymentField'
import { InterestField } from '../../components/InterestField'
import { TermChips } from '../../components/TermChips'
import { canCreateContract, isMerchantAdminOrAbove } from '../../constants/roles'
import { defaultTemplateOf, financingFor, preferredTermOf, selectableTemplatesFor, termsOf, type QuoteHandoff } from '../../utils/quote'
import { unitPrice } from '../../utils/product'
import type { AuthUser } from '../../types/installment'
import type { ContractTemplate } from '../../types/contractTemplate'
import type { Product, ProductUnit } from '../../types/product'
import { conditionLabel, conditionOf, type Condition, type ModelGroup } from './models'

const priceFormatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 })

const CONDITION_ORDER: Condition[] = ['new', 'A', 'B', 'C', 'D']

interface Props {
  actor: AuthUser
  group: ModelGroup
  // Available units of this model the viewer can see, at any branch.
  units: ProductUnit[]
  // The branch the page was narrowed to, if any — quoted from first.
  preferredBranch?: string
  // A scanned IMEI's unit — quoted as-is.
  matchedUnitId?: string
  // After "Start contract" hands over — the modal closes behind it.
  onStarted: () => void
}

interface Variant {
  storage?: string
  color?: string
  condition?: Condition
}

const uniq = <T,>(values: (T | undefined)[]) => [...new Set(values.filter((v): v is T => v !== undefined))]

// A model's quote, under Price Check's search box. The customer narrows it the way they'd ask — storage,
// color, condition — each a dropdown where only what's in stock at the
// branch can be picked; then the monthly for a template, term and down payment. The
// same choices, limits and maths as the contract's own Template & Terms
// step, so the number quoted is the number the contract comes to. Nothing
// about cost or profit: this is the screen that gets turned round to the
// customer.
export function QuoteView({ actor, group, units, preferredBranch, matchedUnitId, onStarted }: Props) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  const templates = selectableTemplatesFor(actor)
  const seesAllBranches = isMerchantAdminOrAbove(actor)
  const products = group.products
  const productById = new Map(products.map(p => [p.id, p]))

  // Branches holding this model, most stock first.
  const stockByBranch = [...units.reduce((m, u) => m.set(u.branch, (m.get(u.branch) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])

  const [branch, setBranch] = useState<string | undefined>()
  const [variant, setVariant] = useState<Variant>({})
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [termMonths, setTermMonths] = useState<number | undefined>()
  const [freeRate, setFreeRate] = useState<number | null>(null)
  const [downPct, setDownPct] = useState(0)

  const template = templates.find(t => t.id === templateId)

  // --- Variants ---------------------------------------------------------

  const unitsAt = (b: string | undefined) => units.filter(u => u.branch === b)
  const matches = (u: ProductUnit, v: Variant) => {
    const p = productById.get(u.productId)!
    return (v.storage === undefined || p.storage === v.storage)
      && (v.color === undefined || p.color === v.color)
      && (v.condition === undefined || conditionOf(u) === v.condition)
  }
  // Every storage/color/condition the model comes in: new SKUs are "New";
  // used SKUs' conditions are their units' grades.
  const storages = uniq(products.map(p => p.storage))
  const colorsFor = (storage?: string) => uniq(products.filter(p => storage === undefined || p.storage === storage).map(p => p.color))
  const conditionsFor = (storage?: string, color?: string) => {
    const fitting = products.filter(p => (storage === undefined || p.storage === storage) && p.color === color)
    const found = fitting.flatMap(p => (p.type === 'new' ? ['new' as const] : units.filter(u => u.productId === p.id).map(conditionOf)))
    return CONDITION_ORDER.filter(c => found.includes(c))
  }

  // Settles a partly-changed choice onto one that exists — keeping what
  // was picked where it's still valid, otherwise the first option in stock
  // at the branch (or simply the first, when the branch has none of it).
  function settle(next: Variant, b: string | undefined): Variant {
    const here = unitsAt(b)
    const inStock = (v: Variant) => here.some(u => matches(u, v))
    const choose = <T,>(options: T[], wanted: T | undefined, test: (o: T) => Variant) =>
      (wanted !== undefined && options.includes(wanted) && (!here.length || inStock(test(wanted))) ? wanted : undefined)
      ?? options.find(o => inStock(test(o)))
      ?? options[0]

    const storage = storages.length ? choose(storages, next.storage, s => ({ storage: s })) : undefined
    const color = choose(colorsFor(storage), next.color, c => ({ storage, color: c }))
    const condition = choose(conditionsFor(storage, color), next.condition, c => ({ storage, color, condition: c }))
    return { storage, color, condition }
  }

  function applyTemplate(t: ContractTemplate | undefined) {
    setTemplateId(t?.id)
    setTermMonths(t ? preferredTermOf(t)?.months : undefined)
    setDownPct(t?.minDownPaymentPercent ?? 0)
  }

  // Each time a model is picked: the scanned unit, or the cheapest one at
  // the branch asked for (or the one with most stock), on the default terms.
  useEffect(() => {
    const matched = units.find(u => u.id === matchedUnitId)
    const startBranch = matched?.branch
      ?? (preferredBranch && units.some(u => u.branch === preferredBranch) ? preferredBranch : undefined)
      ?? stockByBranch[0]?.[0]
      ?? preferredBranch
      ?? actor.branch
    const start = matched ?? unitsAt(startBranch)
      .sort((a, b) => unitPrice(a, productById.get(a.productId)!) - unitPrice(b, productById.get(b.productId)!))[0]
    const p = start ? productById.get(start.productId) : undefined
    setBranch(startBranch)
    setVariant(settle(p && start ? { storage: p.storage, color: p.color, condition: conditionOf(start) } : {}, startBranch))
    applyTemplate(defaultTemplateOf(templates))
    setFreeRate(null)
    // Only on opening — later choices are the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.key, matchedUnitId])

  const here = unitsAt(branch)
  const variantUnits = here.filter(u => matches(u, variant))
  // The scanned unit when it's the one described, otherwise the cheapest.
  const unit = variantUnits.find(u => u.id === matchedUnitId)
    ?? [...variantUnits].sort((a, b) => unitPrice(a, productById.get(a.productId)!) - unitPrice(b, productById.get(b.productId)!))[0]
  const product: Product | undefined = unit
    ? productById.get(unit.productId)
    : products.find(p =>
        (variant.storage === undefined || p.storage === variant.storage)
        && p.color === variant.color
        && (variant.condition === 'new') === (p.type === 'new'))
  const devicePrice = unit && product ? unitPrice(unit, product) : product?.salesPrice ?? 0

  // --- Money ------------------------------------------------------------

  const term = template ? termsOf(template).find(t => t.months === termMonths) : undefined
  const ratePercent = template?.type === 'fixed_rate' ? term?.ratePercent : freeRate ?? undefined
  const financing = template && termMonths && ratePercent != null && devicePrice
    ? financingFor(devicePrice, downPct, ratePercent, termMonths)
    : undefined
  const loanAmount = financing ? financing.devicePrice - financing.downPaymentAmount : 0
  const overLimit = !!template && !!financing && loanAmount > template.maxLoanAmount

  const canStart = canCreateContract(actor) && !!unit && !!product && !!financing && !overLimit && !!template && !!branch

  function startContract() {
    if (!canStart) return
    const quote: QuoteHandoff = {
      branch: branch!,
      unitId: unit!.id,
      productId: product!.id,
      templateId: template!.id,
      termMonths: termMonths!,
      ratePercent: ratePercent!,
      downPaymentPercent: downPct,
    }
    navigate('/contracts/new', { state: { quote } })
    onStarted()
  }

  // --- Pieces -----------------------------------------------------------

  // One variant dropdown — storage or color lists grow with the catalog, so
  // a dropdown rather than chips. Options out of stock at the branch stay
  // listed but disabled, saying so — unless the branch has none of the
  // model at all, when every option stays open so it can still be priced.
  // Hidden when there's nothing to choose (the line above the price says
  // what it is).
  function picker<T extends string>(label: string, options: T[], value: T | undefined, test: (o: T) => Variant, render: (o: T) => string, onPick: (o: T) => void) {
    if (options.length < 2) return null
    return (
      <Form.Item label={label}>
        <Select<T>
          value={value}
          onChange={onPick}
          optionLabelProp="title"
          options={options.map(o => {
            const out = here.length > 0 && !here.some(u => matches(u, test(o)))
            return {
              value: o,
              title: render(o),
              disabled: out,
              label: out
                ? <span>{render(o)} <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>· Out of stock here</Typography.Text></span>
                : render(o),
            }
          })}
        />
      </Form.Item>
    )
  }

  const line = (name: string, value: ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <Typography.Text type="secondary">{name}</Typography.Text>
      <Typography.Text>{value}</Typography.Text>
    </div>
  )

  const description = [variant.storage, variant.color, variant.condition && conditionLabel(variant.condition)].filter(Boolean).join(' · ')

  return (
    <div>
      {/* What's being quoted, and its price. */}
      <div style={{ marginBottom: 16 }}>
        {/* The model's name is already in the search box above — this
            line says which of it. */}
        <Typography.Text type="secondary">{description || group.brand}</Typography.Text>
        <div style={{ fontSize: token.fontSizeHeading3, fontWeight: 600 }}>
          {devicePrice ? priceFormatter.format(devicePrice) : '—'}
        </div>
      </div>

      <Form layout="vertical" component="div">
        {/* Stock: Admin/Owner pick among the branches holding it; everyone
            else is quoting from their own branch. */}
        {seesAllBranches && stockByBranch.length > 0 ? (
          <Form.Item label="Branch">
            <Select
              value={branch}
              onChange={b => { setBranch(b); setVariant(settle(variant, b)) }}
              options={stockByBranch.map(([name, count]) => ({ value: name, label: `${name} · ${count} in stock` }))}
            />
          </Form.Item>
        ) : (
          <Alert
            type={here.length ? 'success' : 'warning'}
            showIcon
            message={here.length
              ? `${here.length} in stock at ${branch}`
              : `Out of stock${branch ? ` at ${branch}` : ''} — this is the price for when it's back in.`}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* One row — short values, and the quote below matters more than
            the space they take. Two to a row on a phone. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', columnGap: 12 }}>
          {picker('Storage', storages, variant.storage, s => ({ storage: s }), s => s,
            s => setVariant(settle({ ...variant, storage: s }, branch)))}
          {picker('Color', colorsFor(variant.storage), variant.color, c => ({ storage: variant.storage, color: c }), c => c,
            c => setVariant(settle({ ...variant, color: c }, branch)))}
          {picker('Condition', conditionsFor(variant.storage, variant.color), variant.condition,
            c => ({ ...variant, condition: c }), conditionLabel,
            c => setVariant(settle({ ...variant, condition: c }, branch)))}
        </div>

        {here.length > 0 && !unit && (
          <Alert type="warning" showIcon message="None of this one in stock here." style={{ marginBottom: 16 }} />
        )}

        {templates.length > 1 && (
          <Form.Item label="Template">
            <Select
              value={templateId}
              onChange={id => applyTemplate(templates.find(t => t.id === id))}
              options={templates.map(t => ({ value: t.id, label: `${t.name}${t.isDefault ? ' (Default)' : ''}` }))}
            />
          </Form.Item>
        )}

        {template && (
          <Form.Item label="Term">
            <TermChips
              value={termMonths}
              onChange={setTermMonths}
              months={termsOf(template).map(t => t.months)}
            />
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: token.fontSizeSM }}>
              {template.type === 'fixed_rate'
                ? `${term?.ratePercent ?? '—'}% per month`
                : 'Free Rate — set the monthly rate below.'}
            </Typography.Text>
          </Form.Item>
        )}

        {/* Down payment before interest: a profit target depends on how
            much is financed. */}
        {template && (
          <Form.Item label="Down payment">
            <DownPaymentField
              value={downPct}
              onChange={p => setDownPct(p ?? template.minDownPaymentPercent)}
              devicePrice={devicePrice}
              min={template.minDownPaymentPercent}
              max={template.maxDownPaymentPercent}
            />
          </Form.Item>
        )}

        {template?.type === 'free_rate' && (
          <Form.Item label="Interest">
            <InterestField
              value={freeRate ?? undefined}
              onChange={r => setFreeRate(r ?? null)}
              loanAmount={devicePrice - Math.round(devicePrice * downPct / 100)}
              months={termMonths}
            />
          </Form.Item>
        )}
      </Form>

      {/* The rest of the breakdown scrolls with the options — the pinned
          line below carries what the customer asks first. */}
      {financing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {line('Financed', priceFormatter.format(loanAmount))}
          {line('Total', priceFormatter.format(financing.totalContractValue))}
        </div>
      )}

      {/* The answer and its action, pinned to the bottom of the modal: the
          options above scroll on a short screen, but the monthly stays in
          view while they change. One line, so the pinned part stays short. */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        // Above the fields scrolling under it — antd's addon inputs sit on a
        // stacking layer of their own, which beat a z-index of 1.
        zIndex: 3,
        background: token.colorBgElevated,
        paddingTop: 12,
      }}>
      {/* Tinted with the brand colour the way an info alert is, so it's the
          first thing the eye lands on. */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        background: token.colorPrimaryBg,
        border: `0.5px solid ${token.colorPrimaryBorder}`,
        borderRadius: token.borderRadiusLG,
        padding: '12px 16px',
      }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ fontSize: token.fontSizeHeading4, fontWeight: 600 }}>
            {financing ? priceFormatter.format(financing.installmentAmount) : '—'}
          </span>
          <Typography.Text type="secondary">
            {financing ? ` /mo × ${financing.paymentTermMonths}` : ' /mo'}
          </Typography.Text>
        </span>
        {financing && (
          <Typography.Text type="secondary" style={{ flexShrink: 0 }}>
            Pay today <Typography.Text>{priceFormatter.format(financing.downPaymentAmount)}</Typography.Text>
          </Typography.Text>
        )}
      </div>

      {overLimit && template && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={`Financed amount is over this template's ${priceFormatter.format(template.maxLoanAmount)} limit — raise the down payment or choose another template.`}
        />
      )}

      {canCreateContract(actor) && (
        <Button
          type="primary"
          block
          icon={<FileText size={16} strokeWidth={2.25} />}
          disabled={!canStart}
          onClick={startContract}
          style={{ marginTop: 16 }}
        >
          Start contract
        </Button>
      )}
      </div>
    </div>
  )
}

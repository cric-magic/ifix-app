import { useLayoutEffect, useRef, useState } from 'react'
import { ConfigProvider, Typography, theme } from 'antd'
import { PAPER_THEME } from '../constants/paperTheme'
import { ImageOff } from 'lucide-react'
import type { CommissionRule, ContractSection, ContractSectionKey } from '../types/contractTemplate'

// The printed contract, per the Contract Template doc's "Contract Content
// Template" layout. Everything here is data-driven so the same component
// serves the template preview (sample values, per the doc's "Sample values
// are used when no contract has been created yet") and, later, a real
// contract printed from its own snapshot — the doc is explicit that the
// printed contract uses the contract's saved copy, not the live template.
export interface ContractDocumentData {
  merchant: {
    name: string
    branchName: string
    legalAddress: string
    phone: string
    logoUrl?: string
    lineQrUrl?: string
  }
  contract: {
    number: string
    createdAt: string
  }
  customer: {
    name: string
    nationalId: string
    address: string
    phone: string
    idCardPhotoUrl?: string
    idCardWithOwnerPhotoUrl?: string
  }
  product: {
    condition: string
    color: string
    imei1: string
    imei2: string
    brand: string
    storage: string
    model: string
    serialNumber: string
  }
  financials: {
    total: number
    downPayment: number
    monthly: number
    termMonths: number
  }
  schedule: {
    period: string
    amount: number
    label: string
    dueDate: string
    status: string
  }[]
  payment: {
    bankName: string
    accountNumber: string
    accountName: string
    promptPayQrUrl?: string
  }
  // The three editable content blocks from the template, plus the penalty
  // text where one is set — and the template's section layout: which of
  // the middle sections print, in what order (see constants/
  // contractSections), with the commission rule for that section.
  content: {
    title: string
    bindingStatement: string
    legalDeclarations: string
    penaltyLegalText?: string
    sections: ContractSection[]
    commission?: CommissionRule
  }
}

// A contract is a paper artifact — dark on white whatever theme the app is
// in — so the whole document renders under PAPER_THEME (see its own file for
// why resetting the app's seeds is required, not just the algorithm).
//
// The contract is laid out as whole Legal sheets, each at its true size —
// the same pages on screen, on paper and in the PDF export. A caller with
// less room scales the sheets down whole (FitToWidth), like a document
// viewer, rather than narrowing and reflowing them.
//
// `indicator` outlines one section — the template editor's way of showing
// which section a row in its list is, and where a moved one landed. Screen
// only: nothing that prints or exports passes it.
export function ContractDocument({ data, indicator }: { data: ContractDocumentData; indicator?: SectionIndicator }) {
  return (
    <ConfigProvider theme={PAPER_THEME}>
      <DocumentBody data={data} indicator={indicator} />
    </ConfigProvider>
  )
}

// Which section the editor is pointing at, in which colour (the app's own
// accent — the document itself renders under the paper theme). `flashId`
// set: a moved section, outlined briefly then faded (a new id restarts
// it); unset: a hovered row, outlined for as long as it's hovered.
export interface SectionIndicator {
  key: ContractSectionKey
  color: string
  flashId?: number
}

function SectionOutline({ indicator }: { indicator: SectionIndicator }) {
  return (
    <div
      aria-hidden
      className={indicator.flashId !== undefined ? 'ifix-section-flash' : undefined}
      style={{
        position: 'absolute',
        inset: -6,
        border: `2px solid ${indicator.color}`,
        // XL: the highlighted blocks' LG corners plus the 6px it sits out.
        borderRadius: 12,
        pointerEvents: 'none',
      }}
    />
  )
}

function DocumentBody({ data, indicator }: { data: ContractDocumentData; indicator?: SectionIndicator }) {
  const { token } = theme.useToken()
  const { merchant, contract, customer, schedule, content } = data

  // Each configurable section's markup. The Payment system section also
  // governs the PromptPay QR beside the signatures — it's the same payment
  // channel — while the LINE QR stays either way.
  const showPaymentSystem = content.sections.some(section => section.key === 'paymentSystem' && section.visible)

  // The document as a flat run of units — the pieces a page break may fall
  // between. Most sections are one unit, kept whole; the two that can run
  // long break more finely: the legal text between paragraphs, and the
  // installment schedule between rows (each page's part of the table
  // repeating the column headings). The full signing block closes the run.
  const units = buildUnits(data, token, showPaymentSystem)

  // Every unit's height at the true page width, measured off-screen and
  // laid into pages below. Re-measured whenever the content changes size
  // (a font arriving, a template edit), so the pages always match.
  const measureRef = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<Measurements | null>(null)
  const unitKey = units.map(u => u.id).join('|')

  useLayoutEffect(() => {
    const layer = measureRef.current
    if (!layer) return
    const measure = () => {
      // Heights in the page's own px whatever zoom the preview is shown at
      // (FitToWidth scales it down): divided by the ruler's known height.
      const ruler = layer.querySelector<HTMLElement>('[data-measure="ruler"]')
      const scale = ruler ? ruler.getBoundingClientRect().height / RULER_PX : 1
      // Hidden for print (display: none) measures as zero — keep what's
      // already laid out rather than collapsing every page.
      if (!scale) return
      const height = (key: string) => {
        const el = layer.querySelector<HTMLElement>(`[data-measure="${key}"]`)
        return el ? el.getBoundingClientRect().height / scale : 0
      }
      const next: Measurements = {
        header: height('header'),
        footer: height('footer'),
        tableHead: height('table-head'),
        units: Object.fromEntries(units.map(u => [u.id, height(u.id)])),
      }
      setMeasured(prev => (prev && sameMeasurements(prev, next) ? prev : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(layer)
    return () => observer.disconnect()
    // unitKey stands in for `units`, which is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitKey])

  const pages = measured ? paginate(units, measured) : null

  const header = <DocumentHeader data={data} token={token} />
  const footer = (page: number, total: number) => (
    <DocumentFooter merchantName={merchant.name} customerName={customer.name} createdAt={contract.createdAt} page={page} total={total} token={token} />
  )

  return (
    // The surface the sheets sit on — a neutral canvas like a document
    // viewer's, so the white pages read as paper rather than as other
    // panels. Both colours come from the light theme this renders inside,
    // so the pages stay white on a grey desk in every app variant.
    <div style={{ position: 'relative', background: token.colorBgLayout, padding: 32, minHeight: '100%' }}>
      {/* The measuring layer: every unit, the header and the footer at the
          content's true width, invisible. Not printed (index.css). */}
      <div
        ref={measureRef}
        className="ifix-contract-measure"
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, width: CONTENT_WIDTH, visibility: 'hidden', pointerEvents: 'none', ...SHEET_TYPE }}
      >
        <div data-measure="ruler" style={{ height: RULER_PX }} />
        <div data-measure="header" style={{ display: 'flow-root' }}>{header}</div>
        <div data-measure="footer" style={{ display: 'flow-root' }}>{footer(1, 1)}</div>
        <div data-measure="table-head" style={{ display: 'flow-root' }}>
          <ScheduleTable rows={[]} token={token} />
        </div>
        {units.map(unit => (
          <div key={unit.id} data-measure={unit.id} style={{ display: 'flow-root' }}>
            {unit.kind === 'row' ? <ScheduleTable rows={[schedule[unit.index]]} token={token} bodyOnly /> : unit.render()}
          </div>
        ))}
      </div>

      <div className="ifix-contract-pages" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {pages?.map((page, i) => (
          <div key={i} className="ifix-contract-page" style={{
            background: token.colorBgContainer,
            color: token.colorText,
            // Every sheet is exactly the paper — Legal at 96dpi — with the
            // margin inside it, so the screen shows the page the printer
            // prints. A narrower panel scales the whole sheet (FitToWidth)
            // rather than reflowing it.
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            margin: '0 auto',
            padding: PAGE_MARGIN,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // The project's second elevation — the page floats above the canvas
            // the way any detached surface does, rather than inventing a third
            // level for this one component.
            boxShadow: token.boxShadowSecondary,
            // Rounded like the app's other surfaces (LG, the panel radius) on
            // screen; the printed sheet is square (index.css's print rules).
            borderRadius: token.borderRadiusLG,
            // Print the blocks' grey fills (Panel) rather than letting the
            // browser strip backgrounds; also keeps the table header's fill.
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
            ...SHEET_TYPE,
          }}>
            {/* The same header on every page. */}
            <div style={{ display: 'flow-root', flexShrink: 0 }}>{header}</div>

            {/* This page's share of the content. */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {page.map(group => (
                <div
                  key={group.id}
                  data-contract-section={group.sectionKey}
                  style={{ position: 'relative', display: 'flow-root', marginTop: group.gap }}
                >
                  {group.sectionKey === 'schedule' && group.rows.length > 0 ? (
                    <>
                      {group.units.filter(u => u.kind === 'block').map(u => (
                        <div key={u.id} style={{ display: 'flow-root' }}>{u.render()}</div>
                      ))}
                      <ScheduleTable rows={group.rows.map(i => schedule[i])} token={token} />
                    </>
                  ) : (
                    group.units.map(u => u.kind === 'block' && (
                      <div key={u.id} style={{ display: 'flow-root' }}>{u.render()}</div>
                    ))
                  )}
                  {indicator?.key === group.sectionKey && <SectionOutline key={indicator.flashId ?? 'hover'} indicator={indicator} />}
                </div>
              ))}
            </div>

            {/* The same footer on every page: the buyer's signature, so
                every sheet is signed, and the page number. */}
            <div style={{ display: 'flow-root', flexShrink: 0 }}>{footer(i + 1, pages.length)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// The type every sheet is set in, measuring layer included — so what's
// measured is what's laid out.
const SHEET_TYPE = { fontSize: 12, lineHeight: 1.6 } as const

// --- Units and pagination --------------------------------------------------

type Unit =
  // A piece kept whole. `gap` is the space above it when it doesn't open a
  // page; `keepWithNext` holds a heading on the same page as what follows.
  | { kind: 'block'; id: string; sectionKey: string; gap: number; keepWithNext?: boolean; render: () => React.ReactNode }
  // One installment schedule row.
  | { kind: 'row'; id: string; sectionKey: 'schedule'; gap: number; index: number }

interface Measurements {
  header: number
  footer: number
  tableHead: number
  units: Record<string, number>
}

function sameMeasurements(a: Measurements, b: Measurements): boolean {
  const close = (x: number, y: number) => Math.abs(x - y) < 0.5
  return close(a.header, b.header) && close(a.footer, b.footer) && close(a.tableHead, b.tableHead)
    && Object.keys(b.units).length === Object.keys(a.units).length
    && Object.entries(b.units).every(([k, v]) => a.units[k] !== undefined && close(a.units[k], v))
}

// A page's content: consecutive units of one section, drawn together (the
// schedule's rows as one table, under its heading if that's on the page).
interface Group {
  id: string
  sectionKey: string
  gap: number
  units: Unit[]
  rows: number[]
}

// Lays the units into pages: each page's content area is what's left of
// the sheet after its margins, header and footer (and the space between
// them). A unit that doesn't fit the room left starts the next page — as
// does a heading whose next unit wouldn't fit with it. A schedule row that
// opens a page's part of the table also pays for the repeated column
// headings. A single unit taller than a whole page gets a page to itself.
function paginate(units: Unit[], m: Measurements): Group[][] {
  const room = PAGE_HEIGHT - 2 * PAGE_MARGIN - m.header - m.footer - FIT_SLACK
  const pages: Group[][] = [[]]
  let used = 0

  const costOf = (unit: Unit, page: Group[]): number => {
    const last = page.at(-1)
    const gap = !last ? 0 : last.sectionKey === unit.sectionKey ? (unit.kind === 'row' ? 0 : unit.gap) : unit.gap
    const opensTable = unit.kind === 'row' && !(last?.sectionKey === 'schedule' && last.rows.length > 0)
    return gap + (opensTable ? m.tableHead : 0) + (m.units[unit.id] ?? 0)
  }

  units.forEach((unit, i) => {
    let page = pages.at(-1)!
    let cost = costOf(unit, page)
    const next = units[i + 1]
    const withNext = unit.kind === 'block' && unit.keepWithNext && next
      ? (next.kind === 'row' ? m.tableHead : 0) + (m.units[next.id] ?? 0)
      : 0
    if (page.length > 0 && used + cost + withNext > room) {
      pages.push([])
      page = pages.at(-1)!
      used = 0
      cost = costOf(unit, page)
    }
    used += cost

    const last = page.at(-1)
    if (last && last.sectionKey === unit.sectionKey) {
      last.units.push(unit)
      if (unit.kind === 'row') last.rows.push(unit.index)
    } else {
      page.push({
        id: unit.id,
        sectionKey: unit.sectionKey,
        gap: page.length === 0 ? 0 : unit.gap,
        units: [unit],
        rows: unit.kind === 'row' ? [unit.index] : [],
      })
    }
  })
  return pages
}

// Height kept spare on every page, so sub-pixel rounding between the
// measuring layer and the sheet can never push the last line off it.
const FIT_SLACK = 4

// The measuring layer's ruler — a known height, to read the zoom it's
// shown at.
const RULER_PX = 1000

function buildUnits(data: ContractDocumentData, token: Token, showPaymentSystem: boolean): Unit[] {
  const { merchant, customer, product, financials, schedule, payment, content } = data
  const commission = content.commission
  const units: Unit[] = []
  const block = (sectionKey: string, id: string, render: () => React.ReactNode, extra?: { gap?: number; keepWithNext?: boolean }) =>
    units.push({ kind: 'block', id, sectionKey, gap: extra?.gap ?? SECTION_GAP, keepWithNext: extra?.keepWithNext, render })
  const paragraphs = (text?: string) => (text ?? '').split(/\n+/).map(p => p.trim()).filter(Boolean)

  for (const section of content.sections.filter(s => s.visible)) {
    const key = section.key
    switch (key) {
      case 'parties':
        block(key, key, () => (
          <Panel token={token}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>ผู้ให้เช่าซื้อ (LESSOR)</div>
                <Field label="ร้านค้า" value={`${merchant.name} (${merchant.branchName})`} token={token} />
                <Field label="ที่อยู่" value={merchant.legalAddress} token={token} />
                <Field label="เบอร์โทร" value={merchant.phone} token={token} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>ผู้เช่าซื้อ (LESSEE)</div>
                <Field label="ชื่อ-นามสกุล" value={customer.name} token={token} />
                <Field label="เลขบัตรประชาชน" value={customer.nationalId} token={token} />
                <Field label="ที่อยู่ / โทร" value={`${customer.address} · ${customer.phone}`} token={token} />
              </div>
            </div>
            <Rule token={token} />
            <Block text={content.bindingStatement} empty="No binding statement yet." token={token} />
          </Panel>
        ))
        break
      case 'asset':
        block(key, key, () => (
          <Panel token={token}>
            <SectionTitle>รายละเอียดสินค้า • Asset Specification</SectionTitle>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="สภาพเครื่อง" value={product.condition} token={token} />
                <Field label="สี" value={product.color} token={token} />
                <Field label="IMEI 1" value={product.imei1} token={token} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="แบรนด์" value={product.brand} token={token} />
                <Field label="สเปค" value={product.storage} token={token} />
                <Field label="IMEI 2" value={product.imei2} token={token} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="รุ่นสินค้า" value={product.model} token={token} />
                <Field label="Serial Number" value={product.serialNumber} token={token} />
              </div>
            </div>
          </Panel>
        ))
        break
      case 'paymentTerms':
        block(key, key, () => (
          <Panel token={token} highlight>
            <SectionTitle>สรุปข้อมูลทางการเงิน • Contract Financial Summary</SectionTitle>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="ราคาสินค้า" value={`${financials.total.toLocaleString()} บาท`} token={token} />
                <Field label="แบ่งจ่ายเดือนละ" value={`${financials.monthly.toLocaleString()} บาท`} token={token} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="ชำระงวดแรก" value={`${financials.downPayment.toLocaleString()} บาท`} token={token} />
                <Field label="จำนวนเดือน" value={`${financials.termMonths} เดือน`} token={token} />
              </div>
            </div>
          </Panel>
        ))
        break
      case 'legal': {
        // One unit per paragraph, so long terms break between paragraphs.
        const texts = [...paragraphs(content.legalDeclarations), ...paragraphs(content.penaltyLegalText)]
        if (texts.length === 0) {
          block(key, `${key}-empty`, () => <Block empty="No legal declarations yet." token={token} />)
        }
        texts.forEach((text, i) => block(key, `${key}-${i}`, () => <Block text={text} token={token} />, { gap: i === 0 ? SECTION_GAP : 0 }))
        break
      }
      case 'schedule':
        block(key, `${key}-title`, () => (
          <SectionTitle>
            ตารางชำระเงิน • Installment Schedule ({financials.termMonths} งวด • รวมงวดดาวน์)
          </SectionTitle>
        ), { keepWithNext: true })
        schedule.forEach((_, index) => units.push({ kind: 'row', id: `${key}-row-${index}`, sectionKey: 'schedule', gap: 0, index }))
        // No schedule yet (a draft): the column headings alone, as before.
        if (schedule.length === 0) block(key, `${key}-empty`, () => <ScheduleTable rows={[]} token={token} />, { gap: 0 })
        break
      case 'nationalId':
        block(key, key, () => (
          <>
            <SectionTitle>รูปบัตรประชาชน &amp; ยืนยันตัวตน • Customer E-KYC Block</SectionTitle>
            <Panel token={token}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 8 }}>สำเนาบัตรประชาชน • Thai ID Card</div>
                  <PhotoSlot url={customer.idCardPhotoUrl} token={token} />
                  <div style={{ marginTop: 8, color: token.colorTextSecondary }}>
                    ผู้ถือบัตร {customer.name}<br />เลขบัตร {customer.nationalId}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 8 }}>รูปถ่ายยืนยันตัวตน • Thai ID Card with Owner</div>
                  <PhotoSlot url={customer.idCardWithOwnerPhotoUrl} token={token} />
                </div>
              </div>
            </Panel>
          </>
        ))
        break
      case 'paymentSystem':
        block(key, key, () => (
          <Panel token={token}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <span>Payment Channel <strong>{payment.bankName}</strong></span>
              <span style={{ color: token.colorTextSecondary }}>เลขบัญชี {payment.accountNumber}</span>
              <span style={{ color: token.colorTextSecondary }}>ชื่อบัญชี {payment.accountName}</span>
            </div>
          </Panel>
        ))
        break
      case 'commission': {
        const rate = commission?.ratePercent ?? 0
        const amount = Math.round(financials.total * rate / 100)
        block(key, key, () => (
          <Panel token={token}>
            <SectionTitle>ค่าคอมมิชชั่น • Commission</SectionTitle>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="อัตรา" value={`${rate}% ของราคาสินค้า`} token={token} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label="จำนวนเงิน" value={`${amount.toLocaleString()} บาท`} token={token} />
              </div>
            </div>
            {commission?.text && <Block text={commission.text} token={token} />}
          </Panel>
        ))
        break
      }
    }
  }

  // The full signing block closes the contract: both parties' signatures and
  // the two QR codes the doc puts side by side. Top-aligned: bottom alignment
  // let a taller caption push its QR upward and a wrapped name push its
  // signature rule upward, so no two columns lined up. Each column starts at
  // the same y and reserves the same signing space, which puts the rules and
  // the QR captions on shared baselines.
  block('signatures', 'signatures', () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Signature name={customer.name} role="ผู้เช่าซื้อ" token={token} />
      <Signature name={merchant.name} role="ผู้ให้เช่าซื้อ" token={token} />
      <QrSlot url={merchant.lineQrUrl} title="LINE OA • แจ้งชำระ" caption="สแกนเพื่อยืนยันสลิป" token={token} />
      {showPaymentSystem && <QrSlot
        url={payment.promptPayQrUrl}
        title="PromptPay • โอนเงิน"
        caption={`${payment.accountName} • ${payment.accountNumber}`}
        token={token}
      />}
    </div>
  ))

  return units
}

// Header — merchant identity left, contract identity and the template's own
// title right. The same on every page.
function DocumentHeader({ data, token }: { data: ContractDocumentData; token: Token }) {
  const { merchant, contract, content } = data
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
      <Logo url={merchant.logoUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{merchant.name} ({merchant.branchName})</div>
        <div style={{ color: token.colorTextSecondary }}>{merchant.legalAddress}</div>
        <div style={{ color: token.colorTextSecondary }}>{merchant.phone}</div>
      </div>
      <div style={{ width: 200, flexShrink: 0 }}>
        <Field label="วันที่เขียนสัญญา" value={contract.createdAt} token={token} />
        <Field label="สัญญาเลขที่" value={contract.number} token={token} />
        <Field label="สินค้าจากร้าน" value={`${merchant.name} (${merchant.branchName})`} token={token} />
        <div style={{ marginTop: 8, fontWeight: 600, fontSize: 13 }}>{content.title}</div>
      </div>
    </div>
  )
}

// Footer — the buyer signs every page here (the full signing block, with
// the seller and the QR codes, closes the last page's content), beside the
// document's provenance and the page number.
function DocumentFooter({ merchantName, customerName, createdAt, page, total, token }: {
  merchantName: string
  customerName: string
  createdAt: string
  page: number
  total: number
  token: Token
}) {
  return (
    <div style={{
      marginTop: 16,
      paddingTop: 8,
      borderTop: `1px solid ${token.colorTextTertiary}`,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      fontSize: 11,
    }}>
      <div style={{ color: token.colorTextTertiary, minWidth: 0 }}>
        เอกสารนี้จัดทำโดยระบบ {merchantName} — {createdAt} · ผู้เช่าซื้อลงลายมือชื่อทุกหน้า
        <div>หน้า {page} / {total}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          ลงชื่อ
          <span style={{ display: 'inline-block', width: 160, height: 32, borderBottom: `1px solid ${token.colorTextTertiary}` }} />
          ผู้เช่าซื้อ
        </div>
        <div style={{ color: token.colorTextSecondary }}>({customerName})</div>
      </div>
    </div>
  )
}

// Legal (8.5 x 14in) at 96dpi — the long paper Thai contracts are usually
// printed on. The Contract Template doc doesn't specify a size, so this is
// a business choice rather than a documented requirement; it's mirrored in
// utils/contractPdf.ts's export format and the @page rule in index.css, so
// all three have to move together.
const PAGE_WIDTH = 816
const PAGE_HEIGHT = 1344

// The sheet's margin, all round: half an inch.
const PAGE_MARGIN = 48
// The content's width inside the margins.
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN

// Space between the contract's middle sections.
const SECTION_GAP = 24

// The document at its true size: the sheet plus the grey desk's 32px either
// side — what a caller scaling the whole page down (FitToWidth) fits.
export const CONTRACT_DESK_WIDTH = PAGE_WIDTH + 32 * 2

type Token = ReturnType<typeof theme.useToken>['token']

// Rules and table borders read off the text scale rather than the border
// scale. antd's border tokens are tuned to separate panels on a screen —
// at rgba(0,0,0,0.06) they all but vanish on paper, where a line has to
// survive a printer. colorTextTertiary is the same ink the secondary copy
// uses, so the gridlines stay visibly a shade lighter than the text.

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 600, marginBottom: 8 }}>{children}</div>
}

function Rule({ token }: { token: Token }) {
  return <div style={{ borderTop: `1px solid ${token.colorTextTertiary}`, margin: '16px 0' }} />
}

// A section of the contract. Only the money blocks are highlighted (the
// financial summary — see renderSection — alongside the installment
// schedule's own grey table): a light grey fill, rounded like the app's own
// panels (LG), so what the customer is signing up to pay stands out. Every
// other section sits straight on the page, set apart by the section spacing
// (SECTION_GAP) and its own heading — boxing everything left nothing standing out. Browsers drop
// background colours when printing unless the page opts in, so the sheet
// sets print-color-adjust: exact (see .ifix-contract-page).
function Panel({ token, highlight, children }: { token: Token, highlight?: boolean, children: React.ReactNode }) {
  return (
    <div style={highlight
      ? { background: token.colorFillTertiary, borderRadius: token.borderRadiusLG, padding: 16 }
      : undefined}
    >
      {children}
    </div>
  )
}

function Field({ label, value, token }: { label: string, value: string, token: Token }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <span style={{ color: token.colorTextSecondary, flexShrink: 0 }}>{label}</span>
      <span style={{ minWidth: 0, wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function Block({ text, empty, token }: { text?: string, empty?: string, token: Token }) {
  if (!text) {
    return empty ? <div style={{ color: token.colorTextDisabled }}>{empty}</div> : null
  }
  return <Typography.Paragraph style={{ marginBottom: 8, fontSize: 12 }}>{text}</Typography.Paragraph>
}

function Logo({ url }: { url?: string }) {
  const { token } = theme.useToken()
  return (
    <div style={{
      width: 56,
      height: 56,
      flexShrink: 0,
      background: token.colorFillSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      color: token.colorTextTertiary,
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <ImageOff size={18} strokeWidth={2.25} />}
    </div>
  )
}

// An ID card's own shape (85.6 × 54 mm), and the photo fitted inside it
// rather than cropped to fill: the copy is there as evidence, so the ID
// number, name and portrait must never be cut off. A real card photo fills
// the slot; any other shape shows grey bars instead of losing an edge.
function PhotoSlot({ url, token }: { url?: string, token: Token }) {
  return (
    <div style={{
      aspectRatio: '85.6 / 54',
      border: url ? undefined : `1px dashed ${token.colorTextTertiary}`,
      borderRadius: token.borderRadiusLG,
      background: url ? token.colorFillSecondary : token.colorBgContainer,
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      color: token.colorTextTertiary,
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : <ImageOff size={18} strokeWidth={2.25} />}
    </div>
  )
}

const SIGNING_SPACE = 72

function Signature({ name, role, token }: { name: string, role: string, token: Token }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Blank space to actually sign in — matched to the QR tile height so
          the rule below lands level with the QR blocks' own captions. */}
      <div style={{ height: SIGNING_SPACE }} />
      <div style={{ borderTop: `1px solid ${token.colorTextTertiary}`, paddingTop: 8 }}>
        ({name})<br />
        <span style={{ color: token.colorTextSecondary }}>({role})　วันที่ __ / __ / __</span>
      </div>
    </div>
  )
}

function QrSlot({ url, title, caption, token }: { url?: string, title: string, caption: string, token: Token }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        width: SIGNING_SPACE,
        height: SIGNING_SPACE,
          background: token.colorFillSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        color: token.colorTextTertiary,
      }}>
        {url
          ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <ImageOff size={16} strokeWidth={2.25} />}
      </div>
      <div style={{ fontWeight: 600, marginTop: 8 }}>{title}</div>
      <div style={{ color: token.colorTextSecondary, fontSize: 11, wordBreak: 'break-word' }}>{caption}</div>
    </div>
  )
}

// `bodyOnly` drops the column headings — for measuring a row on its own
// (the measuring layer), every row keeping its rule so it measures at the
// height it takes mid-table.
function ScheduleTable({ rows, token, bodyOnly }: { rows: ContractDocumentData['schedule'], token: Token, bodyOnly?: boolean }) {
  // The same light grey block as Panel — no outline, rounded — with the rows
  // parted by thin paper-white rules rather than dark gridlines, and the
  // header a shade darker. The fills print because the sheet opts into
  // print-color-adjust (see .ifix-contract-page).
  const cell: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: `1px solid ${token.colorBgContainer}`,
    textAlign: 'left',
    verticalAlign: 'top',
  }
  return (
    <div style={{
      background: token.colorFillTertiary,
      borderRadius: token.borderRadiusLG,
      overflow: 'hidden',
    }}>
      {/* Fixed column widths, so a page's part of the table lines up with
          the next page's and a row measures the same alone as in the table. */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '12%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        {!bodyOnly && (
          <thead>
            <tr style={{ background: token.colorFillTertiary }}>
              <th style={cell}>งวดที่</th>
              <th style={cell}>จำนวนเงิน (บาท)</th>
              <th style={cell}>รายการ</th>
              <th style={cell}>กำหนดชำระ</th>
              <th style={cell}>สถานะ</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => {
            const rowCell = i === rows.length - 1 && !bodyOnly ? { ...cell, borderBottom: 'none' } : cell
            return (
              <tr key={i}>
                <td style={rowCell}>{r.period}</td>
                <td style={rowCell}>{r.amount.toLocaleString()}</td>
                <td style={rowCell}>{r.label}</td>
                <td style={rowCell}>{r.dueDate}</td>
                <td style={{ ...rowCell, color: token.colorTextSecondary }}>{r.status}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

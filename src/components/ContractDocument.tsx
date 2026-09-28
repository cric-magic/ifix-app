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
// fixedWidth holds the sheet at its true page width instead of letting it
// narrow to fit (and reflow into a long strip) — for a caller that scales
// the whole page down itself, like a document viewer (ContractPreviewTab),
// or captures it at print size (the PDF export).
//
// `indicator` outlines one section — the template editor's way of showing
// which section a row in its list is, and where a moved one landed. Screen
// only: nothing that prints or exports passes it.
export function ContractDocument({ data, fixedWidth, indicator }: { data: ContractDocumentData; fixedWidth?: boolean; indicator?: SectionIndicator }) {
  return (
    <ConfigProvider theme={PAPER_THEME}>
      <DocumentBody data={data} fixedWidth={fixedWidth} indicator={indicator} />
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

function DocumentBody({ data, fixedWidth, indicator }: { data: ContractDocumentData; fixedWidth?: boolean; indicator?: SectionIndicator }) {
  const { token } = theme.useToken()
  const { merchant, contract, customer, product, financials, schedule, payment, content } = data


  // Each configurable section's markup. The Payment system section also
  // governs the PromptPay QR beside the signatures — it's the same payment
  // channel — while the LINE QR stays either way.
  const showPaymentSystem = content.sections.some(section => section.key === 'paymentSystem' && section.visible)
  const commission = content.commission

  function renderSection(key: ContractSectionKey) {
    switch (key) {
      case 'parties':
        return (
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
        )
      case 'asset':
        return (
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
        )
      case 'paymentTerms':
        return (
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
        )
      case 'legal':
        return (
          <div>
            <Block text={content.legalDeclarations} empty="No legal declarations yet." token={token} />
            {content.penaltyLegalText && <Block text={content.penaltyLegalText} token={token} />}
          </div>
        )
      case 'schedule':
        return (
          <>
            <SectionTitle>
              ตารางชำระเงิน • Installment Schedule ({financials.termMonths} งวด • รวมงวดดาวน์)
            </SectionTitle>
            <ScheduleTable rows={schedule} token={token} />
          </>
        )
      case 'nationalId':
        return (
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
        )
      case 'paymentSystem':
        return (
          <Panel token={token}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <span>Payment Channel <strong>{payment.bankName}</strong></span>
              <span style={{ color: token.colorTextSecondary }}>เลขบัญชี {payment.accountNumber}</span>
              <span style={{ color: token.colorTextSecondary }}>ชื่อบัญชี {payment.accountName}</span>
            </div>
          </Panel>
        )
      case 'commission': {
        const rate = commission?.ratePercent ?? 0
        const amount = Math.round(financials.total * rate / 100)
        return (
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
        )
      }
    }
  }

  return (
    // The surface the sheet sits on — a neutral canvas like a document
    // viewer's, so the white page reads as paper rather than as another
    // panel. Both colours come from the light theme this renders inside,
    // so the page stays white on a grey desk in every app variant.
    <div style={{ background: token.colorBgLayout, padding: 32, minHeight: '100%' }}>
      <div className="ifix-contract-page" style={{
        background: token.colorBgContainer,
        color: token.colorText,
        // maxWidth caps it at true page width where there's room, and the
        // aspect ratio holds the sheet's proportions where there isn't — a
        // fixed height would have made a squeezed page a long strip, which
        // reads less like paper than no constraint at all. Content longer
        // than one page grows past the ratio, as a real one would spill
        // onto a second sheet.
        maxWidth: PAGE_WIDTH,
        ...(fixedWidth ? { width: PAGE_WIDTH } : {}),
        aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`,
        margin: '0 auto',
        padding: 48,
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
        fontSize: 12,
        lineHeight: 1.6,
      }}>
      {/* Header — merchant identity left, contract identity and the
          template's own title right. */}
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

      {/* The middle sections, in the template's order — hidden ones
          skipped. The header above and the signatures below never move. */}
      {content.sections.filter(section => section.visible).map(section => (
        // Each section's own wrapper carries the spacing below it, so its
        // box is exactly the section — what the editor's indicator outlines.
        <div key={section.key} data-contract-section={section.key} style={{ position: 'relative', marginBottom: SECTION_GAP }}>
          {renderSection(section.key)}
          {indicator?.key === section.key && <SectionOutline key={indicator.flashId ?? 'hover'} indicator={indicator} />}
        </div>
      ))}

      {/* Signatures and the two QR codes the doc puts side by side. */}
      {/* Top-aligned: bottom alignment let a taller caption push its QR
          upward and a wrapped name push its signature rule upward, so no
          two columns lined up. Each column now starts at the same y and
          reserves the same signing space, which puts the rules and the QR
          captions on shared baselines. */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 8 }}>
        <Signature name={customer.name} role="ผู้เช่าซื้อ" token={token} />
        <Signature name={merchant.name} role="ผู้ให้เช่าซื้อ" token={token} />
        <QrSlot
          url={merchant.lineQrUrl}
          title="LINE OA • แจ้งชำระ"
          caption="สแกนเพื่อยืนยันสลิป"
          token={token}
        />
        {showPaymentSystem && <QrSlot
          url={payment.promptPayQrUrl}
          title="PromptPay • โอนเงิน"
          caption={`${payment.accountName} • ${payment.accountNumber}`}
          token={token}
        />}
      </div>

        <div style={{ marginTop: 16, color: token.colorTextTertiary, fontSize: 11 }}>
          เอกสารนี้จัดทำโดยระบบ {merchant.name} — {contract.createdAt} · ทุกหน้าต้องลงลายมือชื่อทั้งสองฝ่าย
        </div>
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

// Space between the contract's middle sections.
const SECTION_GAP = 24
const PAGE_HEIGHT = 1344

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

function PhotoSlot({ url, token }: { url?: string, token: Token }) {
  return (
    <div style={{
      height: 96,
      border: `1px dashed ${token.colorTextTertiary}`,
      borderRadius: token.borderRadiusLG,
      background: token.colorBgContainer,
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

function ScheduleTable({ rows, token }: { rows: ContractDocumentData['schedule'], token: Token }) {
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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: token.colorFillTertiary }}>
            <th style={{ ...cell, width: '12%' }}>งวดที่</th>
            <th style={{ ...cell, width: '22%' }}>จำนวนเงิน (บาท)</th>
            <th style={{ ...cell, width: '30%' }}>รายการ</th>
            <th style={{ ...cell, width: '22%' }}>กำหนดชำระ</th>
            <th style={{ ...cell, width: '14%' }}>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rowCell = i === rows.length - 1 ? { ...cell, borderBottom: 'none' } : cell
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

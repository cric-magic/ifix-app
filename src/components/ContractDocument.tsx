import { ConfigProvider, Typography, theme } from 'antd'
import { PAPER_THEME } from '../constants/paperTheme'
import { ImageOff } from 'lucide-react'

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
  // text where one is set.
  content: {
    title: string
    bindingStatement: string
    legalDeclarations: string
    penaltyLegalText?: string
  }
}

// A contract is a paper artifact — dark on white whatever theme the app is
// in — so the whole document renders under PAPER_THEME (see its own file for
// why resetting the app's seeds is required, not just the algorithm).
export function ContractDocument({ data }: { data: ContractDocumentData }) {
  return (
    <ConfigProvider theme={PAPER_THEME}>
      <DocumentBody data={data} />
    </ConfigProvider>
  )
}

function DocumentBody({ data }: { data: ContractDocumentData }) {
  const { token } = theme.useToken()
  const { merchant, contract, customer, product, financials, schedule, payment, content } = data

  return (
    // The surface the sheet sits on — a neutral canvas like a document
    // viewer's, so the white page reads as paper rather than as another
    // panel. Both colours come from the light theme this renders inside,
    // so the page stays white on a grey desk in every app variant.
    <div style={{ background: token.colorBgLayout, padding: 32, minHeight: '100%' }}>
      <div style={{
        background: token.colorBgContainer,
        color: token.colorText,
        // A4. maxWidth caps it at true A4 width where there's room, and
        // the aspect ratio holds A4's proportions where there isn't — a
        // fixed A4 *height* would have made a squeezed page a long strip,
        // which reads less like paper than no constraint at all. Content
        // longer than one page grows past the ratio, as a real one would
        // spill onto a second sheet.
        maxWidth: PAGE_WIDTH,
        aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`,
        margin: '0 auto',
        padding: 48,
        // Tertiary, not boxShadow — the default's third layer carries an
        // 8px spread that blooms well past the page edge.
        boxShadow: token.boxShadowTertiary,
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

      {/* Lessor / Lessee, then the binding statement that the doc places
          before the product and financial details. */}
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

      <Panel token={token}>
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

      {/* Legal declarations sit immediately before the schedule, per the doc. */}
      <div style={{ marginBottom: 16 }}>
        <Block text={content.legalDeclarations} empty="No legal declarations yet." token={token} />
        {content.penaltyLegalText && <Block text={content.penaltyLegalText} token={token} />}
      </div>

      <SectionTitle>
        ตารางชำระเงิน • Installment Schedule ({financials.termMonths} งวด • รวมงวดดาวน์)
      </SectionTitle>
      <ScheduleTable rows={schedule} token={token} />

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

      <Panel token={token}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <span>Payment Channel <strong>{payment.bankName}</strong></span>
          <span style={{ color: token.colorTextSecondary }}>เลขบัญชี {payment.accountNumber}</span>
          <span style={{ color: token.colorTextSecondary }}>ชื่อบัญชี {payment.accountName}</span>
        </div>
      </Panel>

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
        <QrSlot
          url={payment.promptPayQrUrl}
          title="PromptPay • โอนเงิน"
          caption={`${payment.accountName} • ${payment.accountNumber}`}
          token={token}
        />
      </div>

        <div style={{ marginTop: 16, color: token.colorTextTertiary, fontSize: 11 }}>
          เอกสารนี้จัดทำโดยระบบ {merchant.name} — {contract.createdAt} · ทุกหน้าต้องลงลายมือชื่อทั้งสองฝ่าย
        </div>
      </div>
    </div>
  )
}

// A4 at 96dpi — the page size the printed contract is laid out for.
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

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
  return <div style={{ borderTop: `0.5px solid ${token.colorTextTertiary}`, margin: '16px 0' }} />
}

function Panel({ token, children }: { token: Token, children: React.ReactNode }) {
  return (
    <div style={{
      background: token.colorFillQuaternary,
      padding: 16,
      marginBottom: 16,
    }}>
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
      border: `0.5px dashed ${token.colorTextTertiary}`,
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
      <div style={{ borderTop: `0.5px solid ${token.colorTextTertiary}`, paddingTop: 8 }}>
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
  const cell: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: `0.5px solid ${token.colorTextTertiary}`,
    textAlign: 'left',
    verticalAlign: 'top',
  }
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: 16,
      border: `0.5px solid ${token.colorTextTertiary}`,
    }}>
      <thead>
        <tr style={{ background: token.colorFillQuaternary }}>
          <th style={{ ...cell, width: '12%' }}>งวดที่</th>
          <th style={{ ...cell, width: '22%' }}>จำนวนเงิน (บาท)</th>
          <th style={{ ...cell, width: '30%' }}>รายการ</th>
          <th style={{ ...cell, width: '22%' }}>กำหนดชำระ</th>
          <th style={{ ...cell, width: '14%' }}>สถานะ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={cell}>{r.period}</td>
            <td style={cell}>{r.amount.toLocaleString()}</td>
            <td style={cell}>{r.label}</td>
            <td style={cell}>{r.dueDate}</td>
            <td style={{ ...cell, color: token.colorTextSecondary }}>{r.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

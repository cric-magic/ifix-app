import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ConfigProvider, Segmented, Space, Typography, message, theme } from 'antd'
import { Printer, Download } from 'lucide-react'
import type { Contract, SignedContractFile } from '../../../types/contract'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { ContractDocument } from '../../../components/ContractDocument'
import { PAPER_THEME } from '../../../constants/paperTheme'
import { buildContractDocument } from '../../../utils/contractDocument'
import { downloadContractPdf } from '../../../utils/contractPdf'

interface Props {
  contract: Contract
}

type View = 'generated' | 'signed'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// The printed contract for a real contract — the same document the template
// editor previews, drawn from this contract's own snapshot rather than
// sample values. Per the doc, "the printed contract uses the saved copy, not
// the latest version of the template," so every template-controlled field
// here comes from contract.template (see types/contract.ts's TemplateSnapshot)
// and never from the live record.
//
// Once the customer's signed copy is uploaded (Awaiting Signature →
// Pending Payment), the same panel also shows that file: a switch between
// the generated document and what was actually signed, since both are "the
// contract" and a reviewer will want to compare them.
export function ContractPreviewTab({ contract }: Props) {
  const { token } = theme.useToken()
  const merchant = MOCK_MERCHANTS.find(m => m.id === contract.merchantId)
  const branch = MOCK_BRANCHES.find(b => b.merchantId === contract.merchantId && b.name === contract.branch)

  const data = buildContractDocument(contract, merchant, branch)
  const pageRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const signed = contract.signedContract
  const [view, setView] = useState<View>('generated')
  const showingSigned = view === 'signed' && !!signed

  async function handleDownload() {
    const page = pageRef.current?.querySelector<HTMLElement>('.ifix-contract-page')
    if (!page) return
    setExporting(true)
    try {
      await downloadContractPdf(page, `${contract.contractNumber}.pdf`)
    } catch {
      message.error('Could not generate the PDF')
    } finally {
      setExporting(false)
    }
  }

  function handleDownloadSigned() {
    signed?.files.forEach(file => {
      const link = document.createElement('a')
      link.href = file.dataUrl
      link.download = file.name
      link.click()
    })
  }

  const uploader = signed ? MOCK_USER_ACCOUNTS.find(a => a.id === signed.uploadedBy)?.name : undefined

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        height: 56,
        padding: '0 8px 0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Contract Preview</Typography.Text>
        <Space size={8} style={{ paddingRight: 2 }}>
          {signed && (
            <Segmented<View>
              value={view}
              onChange={setView}
              options={[
                { value: 'generated', label: 'Generated' },
                { value: 'signed', label: 'Signed copy' },
              ]}
            />
          )}
          {showingSigned ? (
            <Button icon={<Download size={16} strokeWidth={2.25} />} onClick={handleDownloadSigned}>
              Download
            </Button>
          ) : (
            <Space size={4}>
              <Button icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => window.print()}>Print</Button>
              <Button
                icon={<Download size={16} strokeWidth={2.25} />}
                loading={exporting}
                onClick={handleDownload}
              >
                Download PDF
              </Button>
            </Space>
          )}
        </Space>
      </div>

      {showingSigned ? (
        <ConfigProvider theme={PAPER_THEME}>
          <SignedCopyView
            files={signed.files}
            caption={`Uploaded${uploader ? ` by ${uploader}` : ''} on ${dateFormatter.format(new Date(signed.uploadedAt))}`}
          />
        </ConfigProvider>
      ) : (
        <div ref={pageRef}>
          <ContractDocument data={data} />
        </div>
      )}
    </div>
  )
}

// The uploaded pages on the same canvas as the generated contract (rendered
// under PAPER_THEME, so it's the same grey desk in every app variant) —
// photos as page-width images like a sheet, a PDF in the browser's own
// viewer at the panel's full width.
function SignedCopyView({ files, caption }: { files: SignedContractFile[]; caption: string }) {
  const { token } = theme.useToken()

  return (
    <div style={{ background: token.colorBgLayout, padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>{caption}</Typography.Text>
      {files.map((file, i) => (
        file.type === 'application/pdf'
          ? <PdfPage key={i} file={file} />
          : (
            <img
              key={i}
              src={file.dataUrl}
              alt={`${file.name} (page ${i + 1})`}
              style={{ display: 'block', width: '100%', maxWidth: 816, boxShadow: token.boxShadowSecondary }}
            />
          )
      ))}
    </div>
  )
}

// Browsers refuse to render a data: URL PDF in a frame, so it's shown
// through a blob URL made from the stored data and released on unmount.
// Unlike a photo page it isn't capped at page width: the browser's viewer
// brings its own toolbar and thumbnail rail and sizes the page itself, so
// capping the frame only squeezed the page smaller inside it.
function PdfPage({ file }: { file: SignedContractFile }) {
  const { token } = theme.useToken()
  const blobUrl = useMemo(() => {
    const [, base64 = ''] = file.dataUrl.split(',')
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  }, [file.dataUrl])

  useEffect(() => () => URL.revokeObjectURL(blobUrl), [blobUrl])

  return (
    <iframe
      src={blobUrl}
      title={file.name}
      style={{ display: 'block', width: '100%', height: 1056, border: 0, boxShadow: token.boxShadowSecondary }}
    />
  )
}

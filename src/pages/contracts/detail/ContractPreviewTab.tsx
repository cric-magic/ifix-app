import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ConfigProvider, Drawer, Dropdown, Segmented, Space, Typography, message, theme } from 'antd'
import { Printer, Download, MoreHorizontal } from 'lucide-react'
import type { Contract, SignedContractFile } from '../../../types/contract'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { MOCK_USER_ACCOUNTS } from '../../../constants/mockUsers'
import { CONTRACT_DESK_WIDTH, ContractDocument } from '../../../components/ContractDocument'
import { FitToWidth } from '../../../components/FitToWidth'
import { PAPER_THEME } from '../../../constants/paperTheme'
import { buildContractDocument } from '../../../utils/contractDocument'
import { downloadContractPdf } from '../../../utils/contractPdf'
import { useIsMobile } from '../../../components/useIsMobile'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'

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
  const isMobile = useIsMobile()
  const appWindow = useAppWindowContainer()
  const [fullSize, setFullSize] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const signed = contract.signedContract
  const [view, setView] = useState<View>('generated')
  const showingSigned = view === 'signed' && !!signed

  // Download PDF captures a separate, off-screen copy of the page held at
  // its true width (rendered only while exporting, below) rather than the
  // one on screen — that one is scaled to fit a narrow panel, and would
  // come out as a shrunken page.
  function handleDownload() {
    setExporting(true)
  }

  useEffect(() => {
    if (!exporting) return
    // The copy lays its pages out after measuring them, a frame or so after
    // it mounts — so wait for them rather than capturing an empty copy.
    let frame = 0
    let tries = 0
    const capture = () => {
      const pages = [...(exportRef.current?.querySelectorAll<HTMLElement>('.ifix-contract-page') ?? [])]
      if (pages.length === 0 && tries++ < 30) {
        frame = requestAnimationFrame(capture)
        return
      }
      downloadContractPdf(pages, `${contract.contractNumber}.pdf`)
        .catch(() => message.error('Could not generate the PDF'))
        .finally(() => setExporting(false))
    }
    capture()
    return () => cancelAnimationFrame(frame)
  }, [exporting, contract.contractNumber])

  function handleDownloadSigned() {
    signed?.files.forEach(file => {
      const link = document.createElement('a')
      link.href = file.dataUrl
      link.download = file.name
      link.click()
    })
  }

  const uploader = signed ? MOCK_USER_ACCOUNTS.find(a => a.id === signed.uploadedBy)?.name : undefined

  const viewSwitch = signed && (
    <Segmented<View>
      value={view}
      onChange={setView}
      block={isMobile}
      options={[
        { value: 'generated', label: 'Generated' },
        { value: 'signed', label: 'Signed copy' },
      ]}
    />
  )

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
        {isMobile ? (
          // Mobile: the header keeps its actions (per the panel-header
          // rule) but folds them behind "…" — Print and Download PDF plus
          // the view switch don't fit beside the title at phone width. The
          // switch gets its own row below instead.
          <div style={{ paddingRight: 2 }}>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: showingSigned
                  ? [{ key: 'download-signed', icon: <Download size={16} strokeWidth={2.25} />, label: 'Download' }]
                  : [
                    { key: 'print', icon: <Printer size={16} strokeWidth={2.25} />, label: 'Print' },
                    { key: 'download', icon: <Download size={16} strokeWidth={2.25} />, label: 'Download PDF', disabled: exporting },
                  ],
                onClick: ({ key }) => {
                  if (key === 'print') window.print()
                  if (key === 'download') handleDownload()
                  if (key === 'download-signed') handleDownloadSigned()
                },
              }}
            >
              <Button aria-label="Contract actions" loading={exporting} icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
            </Dropdown>
          </div>
        ) : (
          <Space size={8} style={{ paddingRight: 2 }}>
            {viewSwitch}
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
        )}
      </div>

      {isMobile && viewSwitch && (
        <div style={{ padding: 16, boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}` }}>{viewSwitch}</div>
      )}

      {showingSigned ? (
        <ConfigProvider theme={PAPER_THEME}>
          <SignedCopyView
            files={signed.files}
            caption={`Uploaded${uploader ? ` by ${uploader}` : ''} on ${dateFormatter.format(new Date(signed.uploadedAt))}`}
          />
        </ConfigProvider>
      ) : (
        // On mobile the fitted page is an overview — its text is far too
        // small to read at phone width — so tapping it opens the page at
        // full size, scrolling both ways, like opening an attachment.
        <div
          role={isMobile ? 'button' : undefined}
          aria-label={isMobile ? 'View contract full size' : undefined}
          onClick={isMobile ? () => setFullSize(true) : undefined}
          style={isMobile ? { cursor: 'zoom-in' } : undefined}
        >
          <FitToWidth width={CONTRACT_DESK_WIDTH}>
            <ContractDocument data={data} />
          </FitToWidth>
          {isMobile && (
            <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: token.fontSizeSM, padding: '12px 16px' }}>
              Tap the page to view it full size
            </Typography.Text>
          )}
        </div>
      )}

      <Drawer
        title={contract.contractNumber}
        open={fullSize}
        onClose={() => setFullSize(false)}
        getContainer={appWindow ?? undefined}
        destroyOnHidden
        styles={{ body: { padding: 0, overflow: 'auto' } }}
      >
        <div style={{ width: CONTRACT_DESK_WIDTH }}>
          <ContractDocument data={data} />
        </div>
      </Drawer>

      {exporting && (
        <div ref={exportRef} style={{ position: 'fixed', left: -10000, top: 0, width: CONTRACT_DESK_WIDTH }} aria-hidden>
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

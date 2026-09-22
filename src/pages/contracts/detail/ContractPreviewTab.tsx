import { Button, Space, Typography, message, theme } from 'antd'
import { Printer, Download } from 'lucide-react'
import type { Contract } from '../../../types/contract'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { ContractDocument } from '../../../components/ContractDocument'
import { buildContractDocument } from '../../../utils/contractDocument'

interface Props {
  contract: Contract
}

// The printed contract for a real contract — the same document the template
// editor previews, drawn from this contract's own snapshot rather than
// sample values. Per the doc, "the printed contract uses the saved copy, not
// the latest version of the template," so every template-controlled field
// here comes from contract.template (see types/contract.ts's TemplateSnapshot)
// and never from the live record.
export function ContractPreviewTab({ contract }: Props) {
  const { token } = theme.useToken()
  const merchant = MOCK_MERCHANTS.find(m => m.id === contract.merchantId)
  const branch = MOCK_BRANCHES.find(b => b.merchantId === contract.merchantId && b.name === contract.branch)

  const data = buildContractDocument(contract, merchant, branch)

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 8px 0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Contract Preview</Typography.Text>
        <Space size={4} style={{ paddingRight: 2 }}>
          <Button icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => window.print()}>Print</Button>
          <Button icon={<Download size={16} strokeWidth={2.25} />} onClick={() => message.info('PDF export coming soon')}>Download PDF</Button>
        </Space>
      </div>

      <ContractDocument data={data} />
    </div>
  )
}

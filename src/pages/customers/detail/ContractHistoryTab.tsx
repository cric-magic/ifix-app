import { ConfigProvider, Table, Typography, theme } from 'antd'
import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Contract } from '../../../types/contract'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { getOutstandingBalance } from '../../../utils/contract'
import { ContractStatusTag } from '../../contracts/components/ContractStatusTag'

interface Props {
  contracts: Contract[]
}

// "Contract history — contracts linked to this customer" per the Customer
// doc's Key Features. A slimmer column set than the full Contracts list
// (Contracts/ContractTable) — branch/net position don't add anything once
// already scoped to one customer.
export function ContractHistoryTab({ contracts }: Props) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  const columns: ColumnsType<Contract> = [
    { title: <span style={{ color: token.colorText }}>Contract No.</span>, dataIndex: 'contractNumber', key: 'contractNumber', fixed: 'left' },
    { title: 'Device', key: 'device', render: (_, c) => `${c.device.brand} ${c.device.model}${c.device.storage ? ` · ${c.device.storage}` : ''}` },
    { title: 'Branch', dataIndex: 'branch', key: 'branch' },
    { title: 'Status', key: 'status', render: (_, c) => <ContractStatusTag status={c.status} /> },
    { title: 'Outstanding', key: 'outstanding', align: 'right', render: (_, c) => <CurrencyDisplay amount={getOutstandingBalance(c)} /> },
  ]

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 16px',
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {contracts.length} Contract{contracts.length === 1 ? '' : 's'}
        </Typography.Text>
      </div>

      <div style={{ padding: 16 }}>
        <ConfigProvider theme={{ components: { Table: { colorText: token.colorTextTertiary, headerColor: token.colorTextTertiary } } }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={contracts}
              size="small"
              pagination={false}
              scroll={contracts.length > 0 ? { x: 'max-content' } : undefined}
              onRow={record => ({
                onClick: () => navigate(`/contracts/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              locale={{
                emptyText: (
                  <TableEmptyState
                    icon={<FileText size={22} strokeWidth={2.25} />}
                    title="No contracts yet"
                    description="Contracts created for this customer will show up here."
                  />
                ),
              }}
            />
          </div>
        </ConfigProvider>
      </div>
    </div>
  )
}

import { ConfigProvider, Table, theme } from 'antd'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Contract } from '../../../types/contract'
import type { Product } from '../../../types/product'
import { CurrencyDisplay } from '../../../components/CurrencyDisplay'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { getOutstandingBalance, getNextDue, getOverdueDays, getNetPosition } from '../../../utils/contract'
import { ContractStatusTag } from './ContractStatusTag'

interface Props {
  contracts: Contract[]
  products: Product[]
  showBranchColumns: boolean
  search: string
}

export function ContractTable({ contracts, products, showBranchColumns, search }: Props) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  const columns: ColumnsType<Contract> = [
    {
      title: <span style={{ color: token.colorText }}>Contract No.</span>,
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      fixed: 'left',
      render: (val: string) => <span style={{ color: token.colorText }}>{val}</span>,
    },
    { title: 'Customer', key: 'customer', render: (_, c) => c.customer.fullName },
    {
      title: 'Device',
      key: 'device',
      render: (_, c) => `${c.device.brand} ${c.device.model}${c.device.storage ? ` · ${c.device.storage}` : ''}`,
    },
    {
      title: 'Outstanding',
      key: 'outstanding',
      align: 'right',
      render: (_, c) => <CurrencyDisplay amount={getOutstandingBalance(c)} />,
    },
    {
      title: 'Next Due',
      key: 'nextDue',
      render: (_, c) => {
        const next = getNextDue(c)
        if (!next) return <span style={{ color: token.colorTextDisabled }}>—</span>
        const overdueDays = getOverdueDays(c)
        return (
          <span>
            {next.dueDate} · <CurrencyDisplay amount={next.amount} />
            {overdueDays > 0 && <span style={{ color: token.colorError }}> · {overdueDays}d overdue</span>}
          </span>
        )
      },
    },
    ...(showBranchColumns ? [
      { title: 'Branch', dataIndex: 'branch', key: 'branch' },
      {
        title: 'Net Position',
        key: 'netPosition',
        align: 'right' as const,
        render: (_: unknown, c: Contract) => {
          const product = products.find(p => p.id === c.device.productId)
          return <CurrencyDisplay amount={getNetPosition(c, product?.costPrice ?? 0)} />
        },
      },
    ] : []),
    // Status pinned last + fixed right, matching every other list table in
    // the app (Branch/Merchant/Product/User) — this table was the one
    // outlier with Status buried mid-row, scrolling out of view once the
    // Admin variant's extra Branch/Net Position columns are added.
    { title: 'Status', key: 'status', fixed: 'right', render: (_, c) => <ContractStatusTag status={c.status} /> },
  ]

  return (
    <ConfigProvider theme={{
      components: {
        Table: {
          colorText: token.colorTextTertiary,
          headerColor: token.colorTextTertiary,
        },
      },
    }}>
      <div className="ifix-table-panel">
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={contracts}
              scroll={contracts.length > 0 ? { x: 'max-content' } : undefined}
              onRow={record => ({
                onClick: () => navigate(`/contracts/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              locale={{
                emptyText: search ? (
                  <TableEmptyState icon={<FileText size={22} strokeWidth={2.25} />} title="No contracts found" description="Try a different contract number, customer name, or IMEI." />
                ) : (
                  <TableEmptyState icon={<FileText size={22} strokeWidth={2.25} />} title="No contracts yet" description="Contracts you create will show up here." />
                ),
              }}
              pagination={{
                pageSize: 10,
                size: 'small',
                showSizeChanger: false,
                prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                showTotal: (total, range) => (
                  <span style={{ color: token.colorTextTertiary }}>
                    {range[0]}–{range[1]} of {total}
                  </span>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}

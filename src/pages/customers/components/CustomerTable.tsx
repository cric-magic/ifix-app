import { ConfigProvider, Table, theme } from 'antd'
import { ChevronLeft, ChevronRight, Contact } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Customer } from '../../../types/customer'
import type { Contract } from '../../../types/contract'
import { TableEmptyState } from '../../../components/TableEmptyState'
import { DotTag } from '../../../components/DotTag'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER } from '../../../constants/paginationIcons'

interface Props {
  customers: Customer[]
  contracts: Contract[]
  search: string
}

export function CustomerTable({ customers, contracts, search }: Props) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  function activeContractCount(customerId: string) {
    return contracts.filter(c => c.customerId === customerId && (c.status === 'active' || c.status === 'overdue')).length
  }

  const columns: ColumnsType<Customer> = [
    {
      title: <span style={{ color: token.colorText }}>Full Name</span>,
      dataIndex: 'fullName',
      key: 'fullName',
      fixed: 'left',
      render: (name: string) => <span style={{ color: token.colorText }}>{name}</span>,
    },
    { title: 'National ID / Passport', dataIndex: 'nationalId', key: 'nationalId' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Active Contracts', key: 'activeContracts', align: 'right', render: (_, c) => activeContractCount(c.id) },
    {
      title: 'Status',
      key: 'blacklisted',
      render: (_, c) => c.blacklisted
        ? <DotTag dotColor={token.colorError}>Blacklisted</DotTag>
        : <DotTag dotColor={token.colorSuccess}>Good Standing</DotTag>,
    },
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
              dataSource={customers}
              scroll={customers.length > 0 ? { x: 'max-content', y: '100%' } : undefined}
              onRow={record => ({
                onClick: () => navigate(`/customers/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              locale={{
                emptyText: search ? (
                  <TableEmptyState icon={<Contact size={22} strokeWidth={2.25} />} title="No customers found" description="Try a different name, National ID, or phone number." />
                ) : (
                  <TableEmptyState icon={<Contact size={22} strokeWidth={2.25} />} title="No customers yet" description="Customers you add will show up here." />
                ),
              }}
              pagination={{
                defaultPageSize: DEFAULT_PAGE_SIZE,
                size: 'small',
                showSizeChanger: PAGE_SIZE_CHANGER,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                prevIcon: <ChevronLeft size={14} strokeWidth={2.25} />,
                nextIcon: <ChevronRight size={14} strokeWidth={2.25} />,
                jumpPrevIcon: JUMP_PREV_ICON,
                jumpNextIcon: JUMP_NEXT_ICON,
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

import { useState } from 'react'
import { App, Button, ConfigProvider, Dropdown, Table, Tag, theme } from 'antd'
import { ChevronLeft, ChevronRight, Copy, Eye, FileStack, MoreHorizontal, Pencil, Power, Archive, Star } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { ContractTemplate } from '../../../../types/contractTemplate'
import type { Contract } from '../../../../types/contract'
import { TableEmptyState } from '../../../../components/TableEmptyState'
import { DotTag } from '../../../../components/DotTag'
import { ContractTemplatePreviewDrawer } from './ContractTemplatePreviewDrawer'

const STATUS_LABELS: Record<ContractTemplate['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

interface Props {
  templates: ContractTemplate[]
  contracts: Contract[]
  canManage: boolean
  search: string
  onEdit: (template: ContractTemplate) => void
  onDuplicate: (template: ContractTemplate) => void
  onSetDefault: (template: ContractTemplate) => void
  onSetStatus: (template: ContractTemplate, status: ContractTemplate['status']) => void
}

export function ContractTemplateTable({ templates, contracts, canManage, search, onEdit, onDuplicate, onSetDefault, onSetStatus }: Props) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null)

  function contractCount(templateId: string) {
    return contracts.filter(c => c.template.templateId === templateId).length
  }

  const columns: ColumnsType<ContractTemplate> = [
    {
      title: <span style={{ color: token.colorText }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      render: (name: string, t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: token.colorText }}>{name}</span>
          {t.isDefault && (
            <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
              Default
            </Tag>
          )}
        </div>
      ),
    },
    { title: 'Type', key: 'type', render: (_, t) => t.type === 'fixed_rate' ? 'Fixed Rate' : 'Free Rate' },
    {
      title: 'Payment Terms',
      key: 'terms',
      render: (_, t) => t.fixedRateTerms
        ? t.fixedRateTerms.map(term => `${term.months}mo (${term.ratePercent}%)`).join(', ')
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    { title: 'Max Loan', key: 'maxLoan', render: (_, t) => `฿${t.maxLoanAmount.toLocaleString()}` },
    { title: 'Contracts', key: 'contractCount', align: 'right', render: (_, t) => contractCount(t.id) },
    {
      title: 'Status',
      key: 'status',
      render: (_, t) => {
        const dotColor = t.status === 'active' ? token.colorSuccess : t.status === 'archived' ? token.colorTextTertiary : token.colorWarning
        return <DotTag dotColor={dotColor}>{STATUS_LABELS[t.status]}</DotTag>
      },
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'right',
      render: (_, t) => (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: 'preview', icon: <Eye size={15} strokeWidth={2.25} />, label: 'Preview' },
                ...(canManage ? [
                  { key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' },
                  { key: 'duplicate', icon: <Copy size={15} strokeWidth={2.25} />, label: 'Duplicate' },
                  ...(t.status === 'active' && !t.isDefault ? [{ key: 'default', icon: <Star size={15} strokeWidth={2.25} />, label: 'Set as default' }] : []),
                  { type: 'divider' as const },
                  ...(t.status === 'draft' ? [{ key: 'activate', icon: <Power size={15} strokeWidth={2.25} />, label: 'Activate' }] : []),
                  ...(t.status === 'active' ? [{ key: 'archive', danger: true, icon: <Archive size={15} strokeWidth={2.25} />, label: 'Archive' }] : []),
                ] : []),
              ],
              onClick: ({ key }) => {
                if (key === 'preview') setPreviewTemplate(t)
                if (key === 'edit') onEdit(t)
                if (key === 'duplicate') onDuplicate(t)
                if (key === 'default') onSetDefault(t)
                if (key === 'activate') onSetStatus(t, 'active')
                if (key === 'archive') {
                  modal.confirm({
                    title: 'Archive this template?',
                    content: 'Archived templates can no longer be edited or selected for new contracts.',
                    okText: 'Archive',
                    okButtonProps: { danger: true },
                    onOk: () => onSetStatus(t, 'archived'),
                  })
                }
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
          </Dropdown>
        </div>
      ),
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
              dataSource={templates}
              scroll={templates.length > 0 ? { x: 'max-content' } : undefined}
              locale={{
                emptyText: search ? (
                  <TableEmptyState icon={<FileStack size={22} strokeWidth={2.25} />} title="No templates found" description="Try a different name or type." />
                ) : (
                  <TableEmptyState icon={<FileStack size={22} strokeWidth={2.25} />} title="No templates yet" description="Templates you create will show up here." />
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

      <ContractTemplatePreviewDrawer
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        values={previewTemplate ?? {}}
      />
    </ConfigProvider>
  )
}

import { useState } from 'react'
import { App, Button, ConfigProvider, Dropdown, Table, Tag, Typography, theme } from 'antd'
import { ChevronLeft, ChevronRight, Copy, Eye, FileStack, MoreHorizontal, Pencil, Power, Archive, Star } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { ContractTemplate } from '../../../../types/contractTemplate'
import type { Contract } from '../../../../types/contract'
import { TableEmptyState } from '../../../../components/TableEmptyState'
import { DotTag } from '../../../../components/DotTag'
import { MOCK_USER_ACCOUNTS } from '../../../../constants/mockUsers'
import { ContractTemplatePreviewDrawer } from './ContractTemplatePreviewDrawer'
import { JUMP_PREV_ICON, JUMP_NEXT_ICON, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, PAGE_SIZE_CHANGER } from '../../../../constants/paginationIcons'
import { useColumnPicker } from '../../../../components/useColumnPicker'
import { withColumnMinWidths } from '../../../../components/tableColumns'

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const STATUS_LABELS: Record<ContractTemplate['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

interface Props {
  templates: ContractTemplate[]
  contracts: Contract[]
  canManage: boolean
  hasActiveFilter: boolean
  // Detail views put the title and primary action inside the panel's own
  // header row; list views leave both out and render them above the panel
  // instead (see CLAUDE.md's "Panel header actions"). Set on the former.
  headerTitle?: string
  // The settings list's fill-height layout: rows scroll inside the panel
  // under a pinned header and pagination (see .ifix-fill-page in
  // index.css). Off in the merchant detail tab.
  fillHeight?: boolean
  headerAction?: React.ReactNode
  // Detail views hand their filters to the panel as well, sharing the
  // header row with the action button rather than taking a second row —
  // a filter only narrows this panel's table, so it belongs to the panel,
  // but it doesn't warrant its own bar. List views render theirs above.
  filters?: React.ReactNode
  onEdit: (template: ContractTemplate) => void
  onDuplicate: (template: ContractTemplate) => void
  onSetDefault: (template: ContractTemplate) => void
  onSetStatus: (template: ContractTemplate, status: ContractTemplate['status']) => void
}

export function ContractTemplateTable({ templates, contracts, canManage, hasActiveFilter, fillHeight, headerTitle, headerAction, filters, onEdit, onDuplicate, onSetDefault, onSetStatus }: Props) {
  const applyColumnPicker = useColumnPicker('contract-templates', ['name', 'status'])
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null)

  function userName(id: string | null) {
    return id ? MOCK_USER_ACCOUNTS.find(u => u.id === id)?.name : undefined
  }

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
    { title: 'Template Title', key: 'title', render: (_, t) => t.title },
    {
      title: 'Payment Terms',
      key: 'terms',
      render: (_, t) => t.fixedRateTerms
        ? t.fixedRateTerms.map(term => `${term.months}mo (${term.ratePercent}%)`).join(', ')
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    { title: 'Max Loan', key: 'maxLoan', align: 'right', render: (_, t) => `฿${t.maxLoanAmount.toLocaleString()}` },
    {
      // Free Rate only, per the doc — a Fixed Rate template has no
      // per-contract payment cap to show.
      title: 'Max Payment',
      key: 'maxPayment',
      align: 'right',
      render: (_, t) => t.maxPaymentAmount != null
        ? `฿${t.maxPaymentAmount.toLocaleString()}`
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    { title: 'Contracts', key: 'contractCount', align: 'right', render: (_, t) => contractCount(t.id) },
    {
      title: 'Updated',
      key: 'updated',
      render: (_, t) => t.updatedAt
        ? (
          <span>
            {dateFormatter.format(new Date(t.updatedAt))}
            {userName(t.updatedBy) && <span style={{ color: token.colorTextDisabled }}> · {userName(t.updatedBy)}</span>}
          </span>
        )
        : <span style={{ color: token.colorTextDisabled }}>—</span>,
    },
    {
      title: 'Status',
      key: 'status',
      fixed: 'right',
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
      // Every action in this menu is Admin/Owner-only, so Staff and Branch
      // Manager get no trigger at all rather than an empty dropdown.
      render: (_, t) => !canManage ? null : (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                // Preview is ❌ for Staff and Branch Manager in the doc's
                // permission table — they select an active template during
                // contract creation rather than inspecting the document here.
                ...(canManage ? [
                  { key: 'preview', icon: <Eye size={15} strokeWidth={2.25} />, label: 'Preview' },
                  // Archived templates are locked outright — the doc's
                  // permission table gives "Edit Archived Template" a ❌ for
                  // every role, Super Admin included. Duplicate stays: it
                  // produces a new Draft rather than touching this record,
                  // which is the documented way to revive an archived one.
                  ...(t.status !== 'archived' ? [{ key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' }] : []),
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
      <div className="ifix-table-panel ifix-stackable-panel">
        {(headerTitle || filters || headerAction) && (
          // Layout lives in index.css (.ifix-stackable-header) so it can
          // stack when the panel is narrow — see the note there.
          <div className="ifix-stackable-header">
            {headerTitle && (
              <Typography.Text strong style={{ fontSize: 15, flexShrink: 0 }}>{headerTitle}</Typography.Text>
            )}
            {/* Filters and the action button travel together on the right,
                so the header reads as title | controls rather than three
                separate things spread across the row. */}
            <div className="ifix-stackable-header-controls">
              {filters}
              {headerAction && <div className="ifix-stackable-header-action">{headerAction}</div>}
            </div>
          </div>
        )}
        <div style={{ padding: 16 }}>
          <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
            <Table
              rowKey="id"
              columns={applyColumnPicker(withColumnMinWidths(columns))}
              dataSource={templates}
              scroll={templates.length > 0 ? { x: 'max-content', ...(fillHeight ? { y: '100%' } : {}) } : undefined}
              locale={{
                emptyText: hasActiveFilter ? (
                  <TableEmptyState icon={<FileStack size={22} strokeWidth={2.25} />} title="No templates found" description="Try a different name, status, or type." />
                ) : (
                  <TableEmptyState icon={<FileStack size={22} strokeWidth={2.25} />} title="No templates yet" description="Templates you create will show up here." />
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

      <ContractTemplatePreviewDrawer
        merchantId={previewTemplate?.merchantId}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        values={previewTemplate ?? {}}
      />
    </ConfigProvider>
  )
}

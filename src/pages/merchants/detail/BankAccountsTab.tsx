import { useState } from 'react'
import { App, Button, ConfigProvider, Dropdown, Table, Tag, Typography, theme } from 'antd'
import { Plus, Pencil, Trash2, MoreHorizontal, Landmark, Star } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import type { BankAccountProfile, Merchant } from '../../../types/merchant'
import { BankAccountModal } from '../components/BankAccountModal'
import { TableEmptyState } from '../../../components/TableEmptyState'

interface Props {
  merchant: Merchant
  canManage: boolean
  onChanged: () => void
  // Detail-view usage (MerchantDetailPage — stacked alongside Overview/
  // Branches panels) keeps the title + button inside the panel's own
  // header row, per CLAUDE.md's detail-view convention — the default here,
  // so that existing call site needs no changes. Standalone usage
  // (WorkspaceBankAccountsPage — its own sub-nav tab, not stacked with
  // other panels) instead follows the list-view convention: the button
  // moves into its own row above a header-less panel containing just the
  // table, and becomes the primary action since there's nothing else
  // competing for that role on the page. Same modal/state stays owned
  // internally either way — only the surrounding chrome changes.
  standalone?: boolean
}

export function BankAccountsTab({ merchant, canManage, onChanged, standalone }: Props) {
  const { token } = theme.useToken()
  const { modal, message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccountProfile | null>(null)

  function handleSave(account: BankAccountProfile) {
    const isNew = !merchant.bankAccounts.some(a => a.id === account.id)
    // Only one default at a time — setting this one clears any other.
    if (account.isDefault) {
      merchant.bankAccounts.forEach(a => { a.isDefault = false })
    }
    if (isNew) {
      merchant.bankAccounts.push(account)
    } else {
      const idx = merchant.bankAccounts.findIndex(a => a.id === account.id)
      merchant.bankAccounts[idx] = account
    }
    setModalOpen(false)
    setEditingAccount(null)
    onChanged()
    message.success(isNew ? 'Bank account added' : 'Bank account updated')
  }

  function handleRemove(account: BankAccountProfile) {
    const idx = merchant.bankAccounts.findIndex(a => a.id === account.id)
    if (idx !== -1) merchant.bankAccounts.splice(idx, 1)
    onChanged()
    message.success('Bank account removed')
  }

  function handleSetDefault(account: BankAccountProfile) {
    merchant.bankAccounts.forEach(a => { a.isDefault = a.id === account.id })
    onChanged()
    message.success(`${account.bank} set as default`)
  }

  const columns: ColumnsType<BankAccountProfile> = [
    {
      title: <span style={{ color: token.colorText }}>Bank</span>,
      dataIndex: 'bank',
      key: 'bank',
      fixed: 'left',
      render: (bank: string, a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: token.colorText }}>{bank}</span>
          {a.isDefault && (
            <Tag style={{ margin: 0, background: token.colorFillSecondary, color: token.colorTextSecondary, fontSize: token.fontSizeSM, border: 'none' }}>
              Default
            </Tag>
          )}
        </div>
      ),
    },
    { title: 'Account number', dataIndex: 'accountNumber', key: 'accountNumber' },
    { title: 'Account name', dataIndex: 'accountName', key: 'accountName' },
    { title: 'Branch', key: 'branch', render: (_, a) => a.branch ?? <span style={{ color: token.colorTextDisabled }}>—</span> },
    ...(canManage ? [{
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, a: BankAccountProfile) => (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              { key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' },
              ...(a.isDefault ? [] : [{ key: 'default', icon: <Star size={15} strokeWidth={2.25} />, label: 'Set as default' }]),
              { type: 'divider' as const },
              { key: 'remove', danger: true, icon: <Trash2 size={15} strokeWidth={2.25} />, label: 'Remove' },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') { setEditingAccount(a); setModalOpen(true) }
              if (key === 'default') handleSetDefault(a)
              if (key === 'remove') {
                modal.confirm({
                  title: 'Remove this bank account?',
                  okText: 'Remove',
                  okButtonProps: { danger: true },
                  onOk: () => handleRemove(a),
                })
              }
            },
          }}
        >
          <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
        </Dropdown>
      ),
    }] : []),
  ]

  const table = (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={merchant.bankAccounts}
      size="small"
      pagination={false}
      // Only when there's real data to scroll through — an empty table
      // (just the "No bank accounts yet" placeholder) still computes a
      // fixed-column width slightly wider than the container (the shadow
      // reserved for .ant-table-cell-fix-start/-end), which otherwise
      // triggers a pointless horizontal scrollbar with nothing to scroll to.
      scroll={merchant.bankAccounts.length > 0 ? { x: 'max-content' } : undefined}
      locale={{
        emptyText: (
          <TableEmptyState
            icon={<Landmark size={22} strokeWidth={2.25} />}
            title="No bank accounts yet"
            description="Bank accounts you add will show up here."
          />
        ),
      }}
    />
  )

  return (
    <div>
      {standalone && canManage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => { setEditingAccount(null); setModalOpen(true) }}>
            Add Bank Account
          </Button>
        </div>
      )}

      <ConfigProvider theme={{
        components: {
          Table: {
            colorText: token.colorTextTertiary,
            headerColor: token.colorTextTertiary,
          },
        },
      }}>
        <div className="ifix-table-panel" style={standalone ? undefined : { marginBottom: 16 }}>
          {!standalone && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
              paddingLeft: 16,
              paddingRight: 8,
              boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
            }}>
              <Typography.Text strong style={{ fontSize: 15 }}>
                {merchant.bankAccounts.length} Bank Account{merchant.bankAccounts.length === 1 ? '' : 's'}
              </Typography.Text>
              {canManage && (
                // paddingRight: 2 on top of the header row's own 8px —
                // matches the button's own top/bottom centering gap (10px,
                // the derived (56 - 36) / 2 remainder from centering a
                // 36px-tall button in this 56px-tall row), so the button
                // sits equidistant from all three edges instead of closer
                // to the right one.
                <div style={{ paddingRight: 2 }}>
                  <Button icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => { setEditingAccount(null); setModalOpen(true) }}>
                    Add Bank Account
                  </Button>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: 16 }}>
            <div className="ifix-panel-table" style={{ margin: '0 -16px' }}>
              {table}
            </div>
          </div>
        </div>
      </ConfigProvider>

      <BankAccountModal
        open={modalOpen}
        account={editingAccount}
        onClose={() => { setModalOpen(false); setEditingAccount(null) }}
        onSaved={handleSave}
      />
    </div>
  )
}

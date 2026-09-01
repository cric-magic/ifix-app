import { useState } from 'react'
import { App, Button, Dropdown, Typography, theme } from 'antd'
import { Pencil, Trash2, MoreHorizontal, Landmark } from 'lucide-react'
import type { Branch } from '../../../types/branch'
import type { BankAccountProfile } from '../../../types/merchant'
import { useIconColors } from '../../../constants/iconColors'
import { BankAccountModal } from '../../merchants/components/BankAccountModal'

interface Props {
  branch: Branch
  canManage: boolean
  onChanged: () => void
}

// A branch has at most one bank account (unlike Merchant's list), so this
// renders as a single record row or an empty state — never a table.
export function BankAccountTab({ branch, canManage, onChanged }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const { modal, message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)

  function handleSave(account: BankAccountProfile) {
    const isNew = !branch.bankAccount
    branch.bankAccount = account
    setModalOpen(false)
    onChanged()
    message.success(isNew ? 'Bank account added' : 'Bank account updated')
  }

  function handleRemove() {
    branch.bankAccount = undefined
    onChanged()
    message.success('Bank account removed')
  }

  return (
    <div className="ifix-table-panel" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 16,
        paddingRight: 8,
        boxShadow: `inset 0 -0.5px 0 0 ${token.colorBorderSecondary}`,
      }}>
        <Typography.Text strong style={{ fontSize: 15 }}>Bank Account</Typography.Text>
        {canManage && !branch.bankAccount && (
          // paddingRight: 2 on top of the header row's own 8px — matches
          // the button's own top/bottom centering gap (10px, the derived
          // (56 - 36) / 2 remainder from centering a 36px-tall button in
          // this 56px-tall row), so the button sits equidistant from all
          // three edges instead of closer to the right one.
          <div style={{ paddingRight: 2 }}>
            <Button icon={<Landmark size={16} strokeWidth={2.25} />} onClick={() => setModalOpen(true)}>
              Add Bank Account
            </Button>
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {branch.bankAccount ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography.Text style={{ fontSize: 14, display: 'block' }}>{branch.bankAccount.bank}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 2 }}>
                {branch.bankAccount.accountNumber} · {branch.bankAccount.accountName}
                {branch.bankAccount.branch ? ` · ${branch.bankAccount.branch}` : ''}
              </Typography.Text>
            </div>
            {canManage && (
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: [
                    { key: 'edit', icon: <Pencil size={15} strokeWidth={2.25} />, label: 'Edit' },
                    { type: 'divider' },
                    { key: 'remove', danger: true, icon: <Trash2 size={15} strokeWidth={2.25} />, label: 'Remove' },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'edit') setModalOpen(true)
                    if (key === 'remove') {
                      modal.confirm({
                        title: 'Remove this bank account?',
                        okText: 'Remove',
                        okButtonProps: { danger: true },
                        onOk: handleRemove,
                      })
                    }
                  },
                }}
              >
                <Button type="text" size="small" icon={<MoreHorizontal size={15} strokeWidth={2.25} />} />
              </Dropdown>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: iconColors.secondary }}>
            <Landmark size={16} strokeWidth={2.25} />
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>No bank account set.</Typography.Text>
          </div>
        )}
      </div>

      <BankAccountModal
        open={modalOpen}
        account={branch.bankAccount ?? null}
        hideDefaultToggle
        onClose={() => setModalOpen(false)}
        onSaved={handleSave}
      />
    </div>
  )
}

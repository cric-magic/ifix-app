import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input, Checkbox } from 'antd'
import { Select } from '../../../components/AppSelect'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { BankAccountProfile } from '../../../types/merchant'
import { BANKS, generateBankAccountId } from '../../../constants/mockMerchants'

interface Props {
  open: boolean
  account: BankAccountProfile | null
  onClose: () => void
  onSaved: (account: BankAccountProfile) => void
  // Branches only ever have one bank account (per the Branch doc — a
  // singular record, unlike Merchant's list of profiles), so "set as
  // default" has nothing to be "the default" among — hidden there rather
  // than shown as a meaningless always-only-option toggle.
  hideDefaultToggle?: boolean
}

interface FormValues {
  bank: string
  accountNumber: string
  accountName: string
  branch?: string
  qr?: string[]
  isDefault: boolean
}

// Same modal for add and edit — `account` is null for "add", populated for
// "edit" (mirrors CreateUserModal/EditUserModal being two separate
// components, but there's little enough here that one shared form with a
// null-vs-populated `account` prop reads clearer than duplicating it).
export function BankAccountModal({ open, account, onClose, onSaved, hideDefaultToggle }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()

  useEffect(() => {
    if (account) {
      form.setFieldsValue({
        bank: account.bank,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        branch: account.branch,
        qr: account.qrCodeUrl ? [account.qrCodeUrl] : [],
        isDefault: account.isDefault,
      })
    } else {
      form.resetFields()
    }
  }, [account, open, form])

  function handleSubmit(values: FormValues) {
    const saved: BankAccountProfile = {
      id: account?.id ?? generateBankAccountId(),
      bank: values.bank,
      accountNumber: values.accountNumber,
      accountName: values.accountName,
      branch: values.branch,
      qrCodeUrl: values.qr?.[0],
      isDefault: hideDefaultToggle ? true : values.isDefault,
    }
    onSaved(saved)
  }

  return (
    <Drawer
      open={open}
      title={account ? 'Edit bank account' : 'Add bank account'}
      onClose={onClose}
      destroyOnHidden
      width={420}
      getContainer={appWindow ?? undefined}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="Bank" name="bank" rules={[{ required: true, message: 'Required' }]}>
          <Select placeholder="Select bank" options={BANKS.map(b => ({ value: b, label: b }))} />
        </Form.Item>
        <Form.Item label="Account number" name="accountNumber" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. 123-4-56789-0" />
        </Form.Item>
        <Form.Item label="Account name" name="accountName" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. TechFix Repair Co., Ltd." />
        </Form.Item>
        <Form.Item label="Branch" name="branch">
          <Input placeholder="e.g. Nimmanhaemin" />
        </Form.Item>
        <Form.Item label="QR code" name="qr">
          <PhotoUpload maxCount={1} />
        </Form.Item>
        {!hideDefaultToggle && (
          <Form.Item name="isDefault" valuePropName="checked" initialValue={false}>
            <Checkbox>Set as default bank account</Checkbox>
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}

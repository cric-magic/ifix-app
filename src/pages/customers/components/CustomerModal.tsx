import { useEffect } from 'react'
import { Drawer, Button, Space, Form, Input } from 'antd'
import { DatePicker } from '../../../components/AppDatePicker'
import dayjs from 'dayjs'
import { useAppWindowContainer } from '../../../contexts/AppWindowContext'
import type { Customer } from '../../../types/customer'
import { generateCustomerId } from '../../../constants/mockCustomers'
import { useCurrentUser } from '../../../contexts/AuthContext'
import { idFields } from '../../../utils/idNumber'
import { IdNumberField } from '../../../components/IdNumberField'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
  onSaved: (customer: Customer) => void
}

interface FormValues {
  nationalId: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
  email?: string
  idCardAddress: string
  currentAddress: string
  workplaceAddress?: string
}

// Same modal for add and edit, same convention as BankAccountModal —
// `customer` is null for "add", populated for "edit".
export function CustomerModal({ open, customer, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const appWindow = useAppWindowContainer()
  const actor = useCurrentUser()

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        nationalId: customer.nationalId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        dateOfBirth: customer.dateOfBirth,
        email: customer.email,
        idCardAddress: customer.idCardAddress,
        currentAddress: customer.currentAddress,
        workplaceAddress: customer.workplaceAddress,
      })
    } else {
      form.resetFields()
    }
  }, [customer, open, form])

  function handleSubmit(values: FormValues) {
    const saved: Customer = {
      id: customer?.id ?? generateCustomerId(),
      merchantId: customer?.merchantId ?? actor.merchantId!,
      ...idFields(values.nationalId),
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      email: values.email,
      idCardAddress: values.idCardAddress,
      currentAddress: values.currentAddress,
      workplaceAddress: values.workplaceAddress,
      blacklisted: customer?.blacklisted ?? false,
      createdBy: customer?.createdBy ?? actor.id,
      createdAt: customer?.createdAt ?? new Date().toISOString(),
    }
    onSaved(saved)
  }

  return (
    <Drawer
      open={open}
      title={customer ? 'Edit customer' : 'Add customer'}
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
        <IdNumberField form={form} />
        {/* First and last name kept apart, as on the ID card — side by
            side, the same pairing as the contract's Customer step. */}
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="0XX-XXX-XXXX" />
        </Form.Item>
        <Form.Item
          label="Date of Birth"
          name="dateOfBirth"
          rules={[{ required: true, message: 'Required' }]}
          getValueProps={value => ({ value: value ? dayjs(value) : undefined })}
          normalize={value => (value ? value.format('YYYY-MM-DD') : value)}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input placeholder="email@example.com" />
        </Form.Item>
        <Form.Item label="ID Card's Address" name="idCardAddress" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Current Address" name="currentAddress" rules={[{ required: true, message: 'Required' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Workplace Address" name="workplaceAddress">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

import { Descriptions, Form, Input } from 'antd'
import type { CustomerInfo } from '../../../types/installment'

interface Props {
  customer: CustomerInfo
  isEditing: boolean
}

export function CustomerTab({ customer, isEditing }: Props) {
  if (!isEditing) {
    return (
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2 }}
        items={[
          { label: 'Full Name', children: customer.name },
          { label: 'ID Card Number', children: customer.idCardNumber },
          { label: 'Phone', children: customer.phone },
          { label: 'Email', children: customer.email },
          { label: 'Occupation', children: customer.occupation },
          { label: 'Address', children: customer.address, span: 2 },
        ]}
      />
    )
  }

  return (
    <Form layout="vertical" initialValues={customer} style={{ maxWidth: 640 }}>
      <Form.Item label="Full Name" name="name">
        <Input />
      </Form.Item>
      <Form.Item label="ID Card Number" name="idCardNumber">
        <Input />
      </Form.Item>
      <Form.Item label="Phone" name="phone">
        <Input />
      </Form.Item>
      <Form.Item label="Email" name="email">
        <Input />
      </Form.Item>
      <Form.Item label="Occupation" name="occupation">
        <Input />
      </Form.Item>
      <Form.Item label="Address" name="address">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  )
}

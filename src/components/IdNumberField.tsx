import { useState } from 'react'
import { Button, Form, Input, Space, theme } from 'antd'
import type { FormInstance } from 'antd'
import { Check } from 'lucide-react'
import { ID_TYPE_LABELS, normalizeIdNumber, readIdNumber } from '../utils/idNumber'

interface Props {
  form: FormInstance
  // The contract Customer step attaches Look Up to the field's right end.
  onLookup?: () => void
}

// One field for a Thai National ID or a passport number — no type
// dropdown. The type is read from what's typed (utils/idNumber.ts) and
// shown under the field as it's typed, so staff can see how the number was
// understood; on leaving the field a Thai ID is formatted X-XXXX-XXXXX-XX-X
// and a passport uppercased. Errors wait for blur, so a half-typed ID isn't
// flagged mid-way.
export function IdNumberField({ form, onLookup }: Props) {
  const { token } = theme.useToken()
  const raw = (Form.useWatch('nationalId', form) as string | undefined) ?? ''
  const reading = readIdNumber(raw)
  const digits = normalizeIdNumber(raw)
  const digitsOnly = /^\d+$/.test(digits)
  // While a number is still being typed, all digits and short of 13, it's
  // most likely a Thai ID on its way — count towards 13 rather than call a
  // 6–9 digit prefix a "Passport" mid-way. Decided once the field is left.
  const [focused, setFocused] = useState(false)

  const hint = focused && digitsOnly && digits.length < 13
    ? `${digits.length} of 13 digits for a Thai National ID`
    : reading.type
    ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: token.colorSuccess }}>
          <Check size={14} strokeWidth={2.25} />
          {ID_TYPE_LABELS[reading.type]}
        </span>
      )
    : 'Thai National ID (13 digits) or passport number — the type is detected automatically'

  const input = (
    <Form.Item
      name="nationalId"
      noStyle
      validateTrigger="onBlur"
      rules={[
        { required: true, message: 'Required' },
        { validator: (_, value?: string) => {
          const error = value ? readIdNumber(value).error : undefined
          return error ? Promise.reject(new Error(error)) : Promise.resolve()
        } },
      ]}
    >
      <Input
        placeholder="Thai National ID or passport no."
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          const r = readIdNumber(form.getFieldValue('nationalId') ?? '')
          if (r.type) form.setFieldValue('nationalId', r.value)
        }}
      />
    </Form.Item>
  )

  return (
    // The hint steps aside once the field shows an error, so only the error
    // explains what's wrong.
    <Form.Item label="National ID / Passport" required extra={!focused && reading.error ? undefined : hint}>
      {onLookup
        ? (
            <Space.Compact style={{ width: '100%' }}>
              {input}
              <Button onClick={onLookup}>Look Up</Button>
            </Space.Compact>
          )
        : input}
    </Form.Item>
  )
}

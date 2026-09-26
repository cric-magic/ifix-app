import { Input } from 'antd'
import { Search } from 'lucide-react'
import { useIconColors } from '../constants/iconColors'
import { useIsMobile } from './useIsMobile'

interface Props {
  value: string
  onChange: (value: string) => void
  // Names the fields searched ("Search by name, brand, or SKU").
  placeholder: string
  // Shorter text for the narrower mobile toolbar ("Search products").
  mobilePlaceholder: string
}

// A list page's search box, for ListToolbar's `search` slot.
export function ListSearch({ value, onChange, placeholder, mobilePlaceholder }: Props) {
  const iconColors = useIconColors()
  const isMobile = useIsMobile()
  return (
    <Input
      placeholder={isMobile ? mobilePlaceholder : placeholder}
      prefix={<Search size={16} strokeWidth={2.25} color={iconColors.secondary} />}
      allowClear
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ maxWidth: 320 }}
    />
  )
}

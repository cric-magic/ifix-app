import { Button, Switch, Typography, theme } from 'antd'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import type { ContractSection, ContractSectionKey } from '../../../../types/contractTemplate'
import { CONTRACT_SECTIONS, normalizeSections } from '../../../../constants/contractSections'

interface Props {
  // Supplied by Form.Item (the template's `sections` field).
  value?: ContractSection[]
  onChange?: (sections: ContractSection[]) => void
  // For the editor's preview: which section's row is hovered or focused
  // (null when none), and which one just moved or was switched on — so the
  // preview can point at it.
  onPointAt?: (key: ContractSectionKey | null) => void
  onChanged?: (key: ContractSectionKey) => void
}

// The contract's middle sections as a list: each can move up or down, and
// the optional ones switch on or off. Required sections show a lock
// instead of a switch — they always print. Up/down buttons rather than
// drag-and-drop: the list is short, and they work the same with a mouse,
// a keyboard or a finger.
export function ContractSectionsField({ value, onChange, onPointAt, onChanged }: Props) {
  const { token } = theme.useToken()
  const sections = normalizeSections(value)

  function move(index: number, by: -1 | 1) {
    const next = [...sections]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item)
    onChange?.(next)
    onChanged?.(item.key)
  }

  function toggle(index: number, visible: boolean) {
    onChange?.(sections.map((s, i) => (i === index ? { ...s, visible } : s)))
    if (visible) onChanged?.(sections[index].key)
  }

  return (
    <div onMouseLeave={() => onPointAt?.(null)} onBlur={() => onPointAt?.(null)}>
      {sections.map((section, index) => {
        const meta = CONTRACT_SECTIONS[section.key]
        return (
          <div
            key={section.key}
            onMouseEnter={() => onPointAt?.(section.key)}
            onFocus={() => onPointAt?.(section.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              borderBottom: index < sections.length - 1 ? `0.5px solid ${token.colorBorderSecondary}` : undefined,
            }}
          >
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <Button
                type="text"
                size="small"
                aria-label={`Move ${meta.label} up`}
                disabled={index === 0}
                icon={<ChevronUp size={16} strokeWidth={2.25} />}
                onClick={() => move(index, -1)}
              />
              <Button
                type="text"
                size="small"
                aria-label={`Move ${meta.label} down`}
                disabled={index === sections.length - 1}
                icon={<ChevronDown size={16} strokeWidth={2.25} />}
                onClick={() => move(index, 1)}
              />
            </div>
            <Typography.Text
              style={{ flex: 1, minWidth: 0, color: section.visible ? token.colorText : token.colorTextTertiary }}
              ellipsis
            >
              {meta.label}
            </Typography.Text>
            {meta.required ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: token.fontSizeSM, color: token.colorTextTertiary }}>
                <Lock size={12} strokeWidth={2.25} />
                Required
              </span>
            ) : (
              <Switch
                size="small"
                aria-label={`Show ${meta.label}`}
                checked={section.visible}
                onChange={checked => toggle(index, checked)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

import { isValidElement, useState } from 'react'
import type { ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { ColumnPickerButton } from './ColumnPickerButton'

const ACTIONS_KEY = 'actions'
const PICKER_KEY = '__columns'
const PICKER_CLASS = 'ifix-column-picker-cell'

function storageKey(tableKey: string) {
  return `ifix.columns.${tableKey}`
}

// Read/written defensively — storage can be unavailable (private windows,
// blocked site data), and a missing or corrupt entry just means "show all".
function readHidden(tableKey: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(tableKey)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []
  } catch {
    return []
  }
}

function writeHidden(tableKey: string, hidden: string[]) {
  try {
    localStorage.setItem(storageKey(tableKey), JSON.stringify(hidden))
  } catch {
    // Not remembered this time; the choice still applies for this visit.
  }
}

// A column's menu label: its title when that's plain text, or the text
// inside it when a table styles its first title (e.g. Name's darker span).
function labelOf(title: unknown, key: string): string {
  if (typeof title === 'string' && title) return title
  if (isValidElement<{ children?: ReactNode }>(title) && typeof title.props.children === 'string') {
    return title.props.children
  }
  return key
}

// Lets a list table's columns be shown or hidden from a menu in the
// header's top-right corner, like a spreadsheet's column picker.
//
// Called with the table's storage key and its locked columns, it returns a
// function to run over the table's full column list: hidden columns come
// out, and the picker is placed in the header cell above the "…" actions
// column (or in a narrow column of its own when the table has none). Split
// that way so the hook can sit at the top of a component, before any early
// return, while the columns themselves are built further down.
//
// `locked` columns stay on and show greyed out in the menu — the ones a row
// can't be read or acted on without (the row's name, its pinned status, the
// actions menu). Each table remembers its own choice in this browser,
// keyed by `tableKey`.
export function useColumnPicker(tableKey: string, locked: string[]) {
  const [hidden, setHidden] = useState<string[]>(() => readHidden(tableKey))
  const lockedKeys = new Set([...locked, ACTIONS_KEY])

  function toggle(key: string) {
    if (lockedKeys.has(key)) return
    const next = hidden.includes(key) ? hidden.filter(k => k !== key) : [...hidden, key]
    setHidden(next)
    writeHidden(tableKey, next)
  }

  return function applyColumnPicker<T>(columns: ColumnsType<T>): ColumnsType<T> {
    const choosable = columns.filter(c => c.key !== ACTIONS_KEY && c.key != null)
    const items = choosable.map(c => {
      const key = String(c.key)
      return { key, label: labelOf(c.title, key), visible: !hidden.includes(key), locked: lockedKeys.has(key) }
    })
    const picker = <ColumnPickerButton items={items} onToggle={toggle} />

    const visibleColumns = columns.filter(c => c.key == null || lockedKeys.has(String(c.key)) || !hidden.includes(String(c.key)))
    const hasActions = visibleColumns.some(c => c.key === ACTIONS_KEY)

    // PICKER_CLASS drops the column separator on the picker's own header
    // cell (see index.css) — it's the table's last column, with nothing
    // after it to separate from.
    if (hasActions) {
      return visibleColumns.map(c => (c.key === ACTIONS_KEY ? { ...c, title: picker, className: PICKER_CLASS } : c))
    }
    return [
      ...visibleColumns,
      { key: PICKER_KEY, title: picker, width: 56, fixed: 'right', align: 'right', className: PICKER_CLASS, render: () => null },
    ]
  }
}

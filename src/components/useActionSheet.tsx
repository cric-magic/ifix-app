import { useState } from 'react'
import { ActionSheet } from './ActionSheet'
import type { RowAction } from './rowActions'

// Opens the mobile action sheet for a row: `open(title, actions)`, with the
// sheet itself in `sheet` — render it once anywhere in the table component.
export function useActionSheet() {
  const [state, setState] = useState<{ title: string; actions: RowAction[] } | null>(null)
  const [open, setOpen] = useState(false)

  return {
    open: (title: string, actions: RowAction[]) => {
      setState({ title, actions })
      setOpen(true)
    },
    sheet: (
      <ActionSheet
        open={open}
        title={state?.title ?? ''}
        actions={state?.actions ?? []}
        onClose={() => setOpen(false)}
      />
    ),
  }
}

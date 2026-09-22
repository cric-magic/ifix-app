import { Drawer } from 'antd'
import { useAppWindowContainer } from '../../../../contexts/AppWindowContext'
import { ContractTemplatePreview, type PreviewValues } from './ContractTemplatePreview'

interface Props {
  open: boolean
  onClose: () => void
  values: PreviewValues
  merchantId: string | undefined
}

// Read-only preview of a saved template, opened from the list's row menu.
// The editor doesn't use this — it shows the same preview inline beside the
// form so it updates as you type.
export function ContractTemplatePreviewDrawer({ open, onClose, values, merchantId }: Props) {
  const appWindow = useAppWindowContainer()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Contract preview"
      width={760}
      destroyOnHidden
      getContainer={appWindow ?? undefined}
    >
      <ContractTemplatePreview values={values} merchantId={merchantId} />
    </Drawer>
  )
}

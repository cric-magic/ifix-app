import { Alert, Button } from 'antd'
import type { ProductUnit } from '../../../types/product'

interface Props {
  unit: ProductUnit
  // Fills the serial and IMEI fields with this unit's own values.
  onFill: () => void
}

// The note above Device Info when the unit came from browsing: staff type
// the serial and IMEI off the box label. Nobody clicking through the
// prototype has a box, so the note also carries a "Fill demo values"
// button — a stand-in for the label, not part of the real flow.
export function BoxLabelNote({ unit, onFill }: Props) {
  return (
    <Alert
      type="info"
      showIcon
      message={`Enter the serial number${unit.imei1 ? ' and IMEI' : ''} from the box label — they're checked against ${unit.serialNumber}.`}
      action={<Button size="small" onClick={onFill}>Fill demo values</Button>}
      style={{ marginBottom: 16, alignItems: 'center' }}
    />
  )
}

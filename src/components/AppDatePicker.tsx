import { DatePicker as AntdDatePicker } from 'antd'
import type { DatePickerProps } from 'antd'

// Typed dates: antd only accepts text that matches one of the picker's
// formats, and every picker used to be YYYY-MM-DD alone — so typing a birth
// date the way people write it (02/10/1992) was silently thrown away and
// the only way in was clicking back decades in the calendar.
//
// The first format is what the field displays; the rest are extra ways the
// same date can be typed. Day-first throughout (Thai convention), so
// 02/10/1992 is 2 October. Digits alone (02101992) work too, and ISO still
// parses for anyone pasting a stored value.
//
// This only changes the text in the field — the form still gets a dayjs
// value, and each form's own normalize/format decides how it's stored.
const DATE_INPUT_FORMATS = ['DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'DDMMYYYY', 'YYYY-MM-DD']

export function DatePicker(props: DatePickerProps) {
  return <AntdDatePicker format={DATE_INPUT_FORMATS} placeholder="DD/MM/YYYY" {...props} />
}

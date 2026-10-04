import type { LabelSize } from '../types/merchant'

// Sticker sizes a merchant can print on, in mm (see LabelSize). The label
// is laid out in real mm units so the preview and the print match the roll
// in the printer.
export const LABEL_SIZES: Record<LabelSize, { width: number; height: number; label: string }> = {
  '40x30': { width: 40, height: 30, label: '40 × 30 mm' },
  '50x30': { width: 50, height: 30, label: '50 × 30 mm' },
}

// One dot of a 203 dpi thermal printer, the common label-printer
// resolution (8 dots/mm). A barcode's narrowest bar is a whole number of
// dots, never less than one — a bar between dots prints at uneven widths
// and scans badly.
export const PRINTER_DOT_MM = 0.125

// CSS px per mm (96 dpi) — for the barcode and QR encoders, which take
// pixel sizes, and for scaling the on-screen preview.
export const PX_PER_MM = 96 / 25.4

import type { LabelSize } from '../types/merchant'

// Sticker sizes a merchant can print on, in mm (see LabelSize). The label
// is laid out in real mm units so the preview and the print match the roll
// in the printer.
export const LABEL_SIZES: Record<LabelSize, { width: number; height: number; label: string }> = {
  '40x30': { width: 40, height: 30, label: '40 × 30 mm' },
  '50x30': { width: 50, height: 30, label: '50 × 30 mm' },
}

// CSS px per mm (96 dpi) — for the barcode and QR encoders, which take
// pixel sizes, and for scaling the on-screen preview.
export const PX_PER_MM = 96 / 25.4

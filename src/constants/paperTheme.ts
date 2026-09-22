import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

// Antd's stock light tokens, computed once at module scope (the same
// getDesignToken pattern CLAUDE.md prescribes for config outside a
// component, so these stay real tokens rather than literal colours).
const STOCK = theme.getDesignToken({ algorithm: theme.defaultAlgorithm })

// The theme for printed artifacts — a contract, a unit label. These are
// paper: a white sheet on a neutral canvas with dark text and a real
// shadow, whatever theme the app itself is in.
//
// Switching a nested ConfigProvider to defaultAlgorithm is NOT enough on
// its own: ConfigProvider merges with the parent, so the app's own seeds
// (VARIANT_SEEDS in App.tsx sets colorBgContainer, boxShadow and friends
// per variant) leak through and the "paper" comes out #050505 in the dark
// variants, or #fafafa with no shadow in Light. Resetting those specific
// seeds to stock is what actually makes the sheet white everywhere.
export const PAPER_THEME: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorBgBase: STOCK.colorBgBase,
    colorBgContainer: STOCK.colorBgContainer,
    colorBgElevated: STOCK.colorBgElevated,
    colorBgLayout: STOCK.colorBgLayout,
    colorBorder: STOCK.colorBorder,
    colorBorderSecondary: STOCK.colorBorderSecondary,
    colorSplit: STOCK.colorSplit,
    colorIcon: STOCK.colorIcon,
    colorIconHover: STOCK.colorIconHover,
    colorTextBase: STOCK.colorTextBase,
    // App.tsx "solidizes" the whole text and fill scale into explicit seed
    // tokens (so alpha-based tokens don't double-render), and explicit seeds
    // are exactly what a nested provider inherits — without resetting these
    // the paper came out with the dark variants' near-white text on a white
    // sheet. Every derived shade has to be listed, not just the base.
    colorText: STOCK.colorText,
    colorTextSecondary: STOCK.colorTextSecondary,
    colorTextTertiary: STOCK.colorTextTertiary,
    colorTextQuaternary: STOCK.colorTextQuaternary,
    colorTextDisabled: STOCK.colorTextDisabled,
    colorFill: STOCK.colorFill,
    colorFillSecondary: STOCK.colorFillSecondary,
    colorFillTertiary: STOCK.colorFillTertiary,
    colorFillQuaternary: STOCK.colorFillQuaternary,
    boxShadow: STOCK.boxShadow,
    boxShadowSecondary: STOCK.boxShadowSecondary,
    boxShadowTertiary: STOCK.boxShadowTertiary,
  },
}

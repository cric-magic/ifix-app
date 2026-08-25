import { createContext, useContext } from 'react'

// The DOM node Drawers (and anything else that would otherwise portal to
// document.body) should mount into instead — DesktopStageLayout's own
// scrollable content div, so overlays stay visually inside the simulated
// app window instead of covering the whole desktop canvas around it. null
// until DesktopStageLayout has mounted and captured the ref; consumers fall
// back to antd's own default (document.body) until then.
const AppWindowContext = createContext<HTMLDivElement | null>(null)

export const AppWindowProvider = AppWindowContext.Provider

export function useAppWindowContainer() {
  return useContext(AppWindowContext)
}

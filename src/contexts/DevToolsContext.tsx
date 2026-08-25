import { createContext, useContext, useState } from 'react'

export interface WindowSize {
  width: number
  height: number
}

// Named reference sizes offered as quick-picks in the menu bar's Viewport
// dropdown. Dragging the window's own resize handles can land on any other
// size — WindowSize itself is just {width, height}, these are only used to
// label the dropdown and to detect when the current size matches one of them.
export const DEVICE_PRESETS: Record<string, WindowSize> = {
  desktop: { width: 1024, height: 700 },
  tablet:  { width: 768,  height: 1024 },
  mobile:  { width: 390,  height: 844 },
}

export const DEVICE_PRESET_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  tablet:  'Tablet',
  mobile:  'Mobile',
}

export type ThemeVariant = 'neutral' | 'blue' | 'light'

export const THEME_LABELS: Record<ThemeVariant, string> = {
  neutral: 'Neutral',
  blue: 'Bluish',
  light: 'Light',
}

interface DevToolsContextValue {
  windowSize: WindowSize
  setWindowSize: (s: WindowSize) => void
  themeVariant: ThemeVariant
  setThemeVariant: (t: ThemeVariant) => void
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null)

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  const [windowSize, setWindowSize] = useState<WindowSize>(DEVICE_PRESETS.desktop)
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>('neutral')
  return (
    <DevToolsContext.Provider value={{ windowSize, setWindowSize, themeVariant, setThemeVariant }}>
      {children}
    </DevToolsContext.Provider>
  )
}

export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) throw new Error('useDevTools must be used inside DevToolsProvider')
  return ctx
}

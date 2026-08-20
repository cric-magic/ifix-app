import { createContext, useContext, useState } from 'react'

export type DeviceSize = 'desktop' | 'tablet' | 'mobile'

export const DEVICE_CONFIG: Record<DeviceSize, { width: number | '100%'; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet:  { width: 768,    label: 'Tablet' },
  mobile:  { width: 390,    label: 'Mobile' },
}

export type ThemeVariant = 'neutral' | 'blue'

export const THEME_LABELS: Record<ThemeVariant, string> = {
  neutral: 'Neutral',
  blue: 'Bluish',
}

interface DevToolsContextValue {
  device: DeviceSize
  setDevice: (d: DeviceSize) => void
  themeVariant: ThemeVariant
  setThemeVariant: (t: ThemeVariant) => void
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null)

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceSize>('desktop')
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>('neutral')
  return (
    <DevToolsContext.Provider value={{ device, setDevice, themeVariant, setThemeVariant }}>
      {children}
    </DevToolsContext.Provider>
  )
}

export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) throw new Error('useDevTools must be used inside DevToolsProvider')
  return ctx
}

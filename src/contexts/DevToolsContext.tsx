import { createContext, useContext, useState } from 'react'

export type DeviceSize = 'desktop' | 'tablet' | 'mobile'

export const DEVICE_CONFIG: Record<DeviceSize, { width: number | '100%'; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet:  { width: 768,    label: 'Tablet' },
  mobile:  { width: 390,    label: 'Mobile' },
}

interface DevToolsContextValue {
  device: DeviceSize
  setDevice: (d: DeviceSize) => void
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null)

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceSize>('desktop')
  return <DevToolsContext.Provider value={{ device, setDevice }}>{children}</DevToolsContext.Provider>
}

export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) throw new Error('useDevTools must be used inside DevToolsProvider')
  return ctx
}

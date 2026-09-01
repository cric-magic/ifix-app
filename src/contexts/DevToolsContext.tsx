import { createContext, useContext, useEffect, useState } from 'react'

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
  inspectMode: boolean
  setInspectMode: (v: boolean) => void
  // Mirrors AppWindowContext's value up to this top-level context so
  // siblings of the router tree (InspectorOverlay, rendered next to
  // DevToolsPanel in App.tsx, not inside DesktopStageLayout's Outlet) can
  // read it too — AppWindowContext's own Provider only reaches descendants
  // of the windowed layout, which InspectorOverlay isn't one of.
  appWindowEl: HTMLElement | null
  setAppWindowEl: (el: HTMLElement | null) => void
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null)

// Persisted so a theme choice survives a reload and — critically — carries
// over to /design-docs, which the "Docs" link always opens in a genuinely
// new tab/page load (see DevToolsPanel.tsx's comment on why), not an
// SPA-internal navigation. Without this, that fresh tab's DevToolsProvider
// re-mounts with the 'neutral' default no matter what was selected in the
// tab it was opened from, so the docs page silently stopped reflecting
// whatever theme the app itself was showing.
const THEME_STORAGE_KEY = 'ifix-theme-variant'

function readStoredThemeVariant(): ThemeVariant {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'neutral' || stored === 'blue' || stored === 'light' ? stored : 'neutral'
}

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  const [windowSize, setWindowSize] = useState<WindowSize>(DEVICE_PRESETS.desktop)
  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>(readStoredThemeVariant)
  const [inspectMode, setInspectMode] = useState(false)
  const [appWindowEl, setAppWindowEl] = useState<HTMLElement | null>(null)

  function setThemeVariant(variant: ThemeVariant) {
    setThemeVariantState(variant)
    localStorage.setItem(THEME_STORAGE_KEY, variant)
  }

  // Keeps an already-open tab (e.g. /design-docs opened before a later
  // theme switch in the main app tab) in sync too — the storage event only
  // fires in OTHER tabs than the one that called setItem, which is exactly
  // the cross-tab case this exists for.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setThemeVariantState(readStoredThemeVariant())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <DevToolsContext.Provider value={{ windowSize, setWindowSize, themeVariant, setThemeVariant, inspectMode, setInspectMode, appWindowEl, setAppWindowEl }}>
      {children}
    </DevToolsContext.Provider>
  )
}

export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) throw new Error('useDevTools must be used inside DevToolsProvider')
  return ctx
}

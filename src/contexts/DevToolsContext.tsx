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

// The app's one mobile breakpoint — the same 768px rule AppLayout uses to
// turn the sidebar into a drawer. Re-exported by components/useIsMobile.
export const MOBILE_MAX_WIDTH = 768

// The two themes the app renders: light, and a dark mode with a bluish
// (navy) tone. What's applied comes from the viewer's preference below.
export type ThemeVariant = 'dark' | 'light'

// What the viewer picked (Account › General › Appearance, or the menu
// bar): a fixed theme, or System — follow the device's light/dark setting.
export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

export const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system']

interface DevToolsContextValue {
  // The app window's size — the simulated device's, or in preview mode the
  // real browser viewport's, so everything sized off it (useIsMobile, the
  // mobile drawer layout, side-by-side editors) responds to the real
  // screen there with no changes of its own.
  windowSize: WindowSize
  // Sets the simulated device size (the Viewport menu, the resize
  // handles). Remembered while in preview, and back on exit.
  setWindowSize: (s: WindowSize) => void
  // Preview: the app on its own, filling the browser tab — no desktop
  // wallpaper, window frame or menu bar — at the real screen size.
  previewMode: boolean
  setPreviewMode: (v: boolean) => void
  // The real browser viewport, whatever the simulated device size — for
  // the prototype's own chrome (the menu bar), which lives in the browser,
  // not inside the simulated window.
  viewport: WindowSize
  // The theme being shown — the preference, with System resolved.
  themeVariant: ThemeVariant
  themePreference: ThemePreference
  setThemePreference: (t: ThemePreference) => void
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
// re-mounts with the 'light' default no matter what was selected in the
// tab it was opened from, so the docs page silently stopped reflecting
// whatever theme the app itself was showing.
const THEME_STORAGE_KEY = 'ifix-theme-variant'

// Read a stored or linked theme choice. Neutral and Bluish were both dark
// themes before Dark became the single (bluish) dark mode, so either
// becomes Dark.
function parseThemePreference(v: string | null): ThemePreference | null {
  if (v === 'light' || v === 'dark' || v === 'system') return v
  if (v === 'neutral' || v === 'blue') return 'dark'
  return null
}

function readStoredThemePreference(): ThemePreference {
  return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY)) ?? 'system'
}

// A shared preview link can carry the theme it was copied in (see
// previewLink), which wins over this browser's own stored choice.
function readInitialThemePreference(): ThemePreference {
  return parseThemePreference(new URLSearchParams(window.location.search).get('theme')) ?? readStoredThemePreference()
}

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

// Preview mode starts on for: a shared preview link (?preview=1); a reload
// while already in preview (kept per tab in sessionStorage, since in-app
// navigation drops the query string); and a real phone-sized screen,
// where a simulated phone window inside a phone makes no sense.
export const PREVIEW_STORAGE_KEY = 'ifix-preview'

function readInitialPreview(): boolean {
  if (new URLSearchParams(window.location.search).get('preview') === '1') return true
  if (sessionStorage.getItem(PREVIEW_STORAGE_KEY) === '1') return true
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches
}

function readViewport(): WindowSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  const [deviceSize, setWindowSize] = useState<WindowSize>(DEVICE_PRESETS.desktop)
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(readInitialThemePreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_SCHEME_QUERY).matches)
  const [inspectMode, setInspectMode] = useState(false)
  const [appWindowEl, setAppWindowEl] = useState<HTMLElement | null>(null)
  const [previewMode, setPreviewModeState] = useState(readInitialPreview)
  const [viewport, setViewport] = useState(readViewport)

  useEffect(() => {
    function onResize() {
      setViewport(readViewport())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Remembered for this tab however preview started (the button, a link,
  // a phone), so a reload after navigating away from the link's URL stays
  // in preview.
  useEffect(() => {
    if (previewMode) sessionStorage.setItem(PREVIEW_STORAGE_KEY, '1')
    else sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
  }, [previewMode])

  function setPreviewMode(on: boolean) {
    setPreviewModeState(on)
    if (on) {
      // Inspect outlines prototype elements — nothing to do in preview.
      setInspectMode(false)
    } else {
      // Drop a shared link's preview params, so a reload after exiting
      // stays out of preview.
      const url = new URL(window.location.href)
      ;['preview', 'as', 'theme'].forEach(key => url.searchParams.delete(key))
      window.history.replaceState(window.history.state, '', url)
    }
  }

  const windowSize = previewMode ? viewport : deviceSize

  // System follows the device live — switching the OS to dark mode (or
  // its own schedule doing it at sunset) re-themes an open app.
  useEffect(() => {
    const query = window.matchMedia(DARK_SCHEME_QUERY)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const themeVariant: ThemeVariant = themePreference === 'system'
    ? (systemDark ? 'dark' : 'light')
    : themePreference

  function setThemePreference(preference: ThemePreference) {
    setThemePreferenceState(preference)
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  }

  // Keeps an already-open tab (e.g. /design-docs opened before a later
  // theme switch in the main app tab) in sync too — the storage event only
  // fires in OTHER tabs than the one that called setItem, which is exactly
  // the cross-tab case this exists for.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setThemePreferenceState(readStoredThemePreference())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <DevToolsContext.Provider value={{ windowSize, setWindowSize, previewMode, setPreviewMode, viewport, themeVariant, themePreference, setThemePreference, inspectMode, setInspectMode, appWindowEl, setAppWindowEl }}>
      {children}
    </DevToolsContext.Provider>
  )
}

export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) throw new Error('useDevTools must be used inside DevToolsProvider')
  return ctx
}

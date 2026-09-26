import { useDevTools } from '../contexts/DevToolsContext'

// The app's one mobile breakpoint — the same 768px rule AppLayout uses to
// turn the sidebar into a drawer. Reads the simulated app window's width
// (DevTools' device size), not the browser's, since that's the screen the
// prototype is being viewed as.
export const MOBILE_MAX_WIDTH = 768

export function useIsMobile() {
  const { windowSize } = useDevTools()
  return windowSize.width <= MOBILE_MAX_WIDTH
}

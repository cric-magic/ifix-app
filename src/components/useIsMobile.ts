import { useDevTools, MOBILE_MAX_WIDTH } from '../contexts/DevToolsContext'

export { MOBILE_MAX_WIDTH }

// Mobile below the 768px breakpoint. Reads the app window's width — the
// simulated device's (DevTools' device size), or the real browser's in
// preview mode — since that's the screen the prototype is being viewed as.
export function useIsMobile() {
  const { windowSize } = useDevTools()
  return windowSize.width <= MOBILE_MAX_WIDTH
}

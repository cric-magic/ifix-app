import { createContext, useContext, useEffect, useState } from 'react'
import type { DependencyList, ReactNode } from 'react'

// Lets a page (e.g. the Contract create/edit wizard) replace AppLayout's
// own Header content — normally the collapse toggle + breadcrumb — with
// its own center/right slots (a Steps progress bar, a close button) for as
// long as it's mounted. AppLayout is both the Provider (so it can read the
// current value while rendering its Header) and, via its Outlet's
// children, an ancestor of every page that might call useSetHeaderContent.
interface HeaderContent {
  center?: ReactNode
  right?: ReactNode
}

interface HeaderContentContextValue {
  headerContent: HeaderContent | null
  setHeaderContent: (content: HeaderContent | null) => void
}

const HeaderContentContext = createContext<HeaderContentContextValue | null>(null)

export function HeaderContentProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<HeaderContent | null>(null)
  return (
    <HeaderContentContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </HeaderContentContext.Provider>
  )
}

function useHeaderContentContext() {
  const ctx = useContext(HeaderContentContext)
  if (!ctx) throw new Error('useHeaderContentContext must be used inside HeaderContentProvider')
  return ctx
}

// AppLayout's own read side.
export function useHeaderContent() {
  return useHeaderContentContext().headerContent
}

// A page's write side — registers `content` for as long as the calling
// component stays mounted, clearing it (restoring AppLayout's own default
// breadcrumb) on unmount. Takes an explicit dependency list, same as
// useEffect/useMemo, rather than re-running on every render: setting
// context state on every render re-renders the Provider (AppLayout), which
// re-renders every consumer including the caller itself, whose effect —
// with no deps — would fire again next tick, forever. Callers should pass
// whatever values their `center`/`right` actually depend on (e.g. a
// wizard's current step) so this only re-registers when something in the
// header would actually look different.
export function useSetHeaderContent(content: HeaderContent, deps: DependencyList) {
  const { setHeaderContent } = useHeaderContentContext()
  useEffect(() => {
    setHeaderContent(content)
    return () => setHeaderContent(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

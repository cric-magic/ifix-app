import { useEffect } from 'react'

// A thin scrollbar drawn over every table's rows, replacing the native
// vertical one (hidden in index.css — see `.ant-table-body`). The native bar
// takes up width wherever the browser draws full scrollbars, and antd
// reserves that width at the end of a pinned header whether or not the rows
// overflow, which left a permanent strip down the right of every list
// panel. This one overlays the rows instead, so it takes no space, yet still
// shows there's more to scroll: visible at rest whenever the rows overflow,
// brighter on hover, and draggable. See .ifix-table-thumb in index.css.
//
// Rendered once (AppLayout) rather than per table: it finds every
// `.ant-table-body` as tables mount and attaches to each, so no table has
// to opt in.
export function TableScrollbars() {
  useEffect(() => {
    const attached = new Map<HTMLElement, () => void>()

    function attach(body: HTMLElement) {
      const container = body.parentElement
      if (!container) return
      const thumb = document.createElement('div')
      thumb.className = 'ifix-table-thumb'
      container.appendChild(thumb)

      const MIN_THUMB = 24

      function metrics() {
        const { scrollHeight, clientHeight, scrollTop } = body
        const range = scrollHeight - clientHeight
        const height = Math.max(MIN_THUMB, clientHeight * clientHeight / scrollHeight)
        return { range, clientHeight, scrollTop, height, travel: clientHeight - height }
      }

      function update() {
        const m = metrics()
        if (m.range <= 1) {
          thumb.style.display = 'none'
          return
        }
        thumb.style.display = 'block'
        thumb.style.height = `${m.height}px`
        // The rows area starts below the pinned header, inside the same
        // container the thumb is positioned against.
        thumb.style.top = `${body.offsetTop + m.travel * (m.scrollTop / m.range)}px`
      }

      // Dragging the thumb scrolls the rows in proportion, like a native bar.
      function onPointerDown(e: PointerEvent) {
        e.preventDefault()
        const startY = e.clientY
        const startScroll = body.scrollTop
        const m = metrics()
        thumb.setPointerCapture(e.pointerId)
        thumb.classList.add('ifix-table-thumb-dragging')
        function onMove(ev: PointerEvent) {
          body.scrollTop = startScroll + (ev.clientY - startY) * (m.range / Math.max(1, m.travel))
        }
        function onUp() {
          thumb.classList.remove('ifix-table-thumb-dragging')
          thumb.removeEventListener('pointermove', onMove)
          thumb.removeEventListener('pointerup', onUp)
          thumb.removeEventListener('pointercancel', onUp)
        }
        thumb.addEventListener('pointermove', onMove)
        thumb.addEventListener('pointerup', onUp)
        thumb.addEventListener('pointercancel', onUp)
      }

      body.addEventListener('scroll', update, { passive: true })
      thumb.addEventListener('pointerdown', onPointerDown)
      const resize = new ResizeObserver(update)
      resize.observe(body)
      if (body.firstElementChild) resize.observe(body.firstElementChild)
      update()

      attached.set(body, () => {
        body.removeEventListener('scroll', update)
        thumb.removeEventListener('pointerdown', onPointerDown)
        resize.disconnect()
        thumb.remove()
      })
    }

    function scan() {
      for (const [body, detach] of attached) {
        if (!body.isConnected) {
          detach()
          attached.delete(body)
        }
      }
      document.querySelectorAll<HTMLElement>('.ant-table-body').forEach(body => {
        if (!attached.has(body)) attach(body)
      })
    }

    // Tables mount and unmount with navigation; rescan at most once a frame.
    let frame = 0
    function scheduleScan() {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        scan()
      })
    }

    scan()
    const observer = new MutationObserver(scheduleScan)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      attached.forEach(detach => detach())
      attached.clear()
    }
  }, [])

  return null
}

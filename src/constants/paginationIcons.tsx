import type { CSSProperties, ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight, Ellipsis } from 'lucide-react'

// Pagination's jump buttons show an ellipsis at rest and a double chevron on
// hover. Passing a bare icon as `jumpPrevIcon`/`jumpNextIcon` would replace
// both (the chevron would show all the time), so this rebuilds antd's own
// markup — same classes, so its opacity swap, hover colour and the
// ellipsis's disabled-text colour still apply — with Lucide glyphs for both
// layers.
//
// antd centres its own text "•••" and icon font via line-height, which an
// svg doesn't sit on cleanly, so both layers are stacked over the full
// button and flex-centred instead. textIndent/letterSpacing are zeroed
// because antd sets them to space out its text dots.
const LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textIndent: 0,
  letterSpacing: 0,
}

function jumpIcon(icon: ReactNode) {
  return (
    <a className="ant-pagination-item-link" style={{ display: 'block', height: '100%' }}>
      <div className="ant-pagination-item-container" style={{ height: '100%' }}>
        <span className="ant-pagination-item-link-icon" style={LAYER}>{icon}</span>
        <span className="ant-pagination-item-ellipsis" style={LAYER}>
          <Ellipsis size={14} strokeWidth={2.25} />
        </span>
      </div>
    </a>
  )
}

export const JUMP_PREV_ICON = jumpIcon(<ChevronsLeft size={14} strokeWidth={2.25} />)
export const JUMP_NEXT_ICON = jumpIcon(<ChevronsRight size={14} strokeWidth={2.25} />)

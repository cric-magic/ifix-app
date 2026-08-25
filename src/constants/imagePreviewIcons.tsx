import { X } from 'lucide-react'

// antd's Image preview lightbox only exposes a supported override for the
// close button (`preview.closeIcon`) — the left/right nav arrows have no
// equivalent prop: antd's PreviewGroup/Image internals always pass their own
// hardcoded LeftOutlined/RightOutlined pair into useMergedPreviewConfig
// regardless of what's passed as `preview.icons`, so that prop is silently
// ignored. Those two are swapped to Lucide's chevron-left/chevron-right via a
// CSS mask-image trick instead — see the `.ant-image-preview-switch-left`/
// `-right` rules in index.css.
//
// size="1em" matches antd's own sizing, which is driven by the
// previewOperationSize component token via font-size on the wrapping button
// rather than a fixed pixel value, so the icon scales with it automatically.
// Color isn't set here: this button inherits antd's previewOperationColor
// token via `color`, and Lucide's `currentColor` stroke picks that up the
// same way the plain-outlined icon did, so it stays a fixed light color on
// the lightbox's always-dark mask regardless of the app's active theme.
export const IMAGE_PREVIEW_CLOSE_ICON = <X size="1em" strokeWidth={2} />

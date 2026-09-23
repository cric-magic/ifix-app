import { useState } from 'react'
import { Image, theme } from 'antd'
import { ImageOff } from 'lucide-react'
import { useIconColors } from '../../../constants/iconColors'
import { IMAGE_PREVIEW_CLOSE_ICON } from '../../../constants/imagePreviewIcons'

interface Props {
  photos?: string[]
  alt: string
}

// The 40px photo beside a product's name in a detail page header — shared
// by a merchant's product detail and Super Admin's catalog entry detail.
// Clicking opens every photo as one preview group; hovering shows the
// count; no photos falls back to an ImageOff placeholder at the same size.
export function ProductPhotoThumbnail({ photos, alt }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [hovered, setHovered] = useState(false)
  const photoCount = photos?.length ?? 0

  return (
    <div
      style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {photoCount > 0 ? (
        <Image.PreviewGroup preview={{ countRender: (current, total) => <span>Photo {current} / {total}</span>, closeIcon: IMAGE_PREVIEW_CLOSE_ICON }}>
          <Image
            src={photos![0]}
            alt={alt}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: token.borderRadiusSM, border: `0.5px solid ${token.colorBorderSecondary}` }}
          />
          {/* Rest of the photos join the same preview group (so the
              thumbnail's click-to-preview cycles through all of them)
              without rendering a second visible thumbnail. */}
          {photos!.slice(1).map((photo, i) => (
            <Image key={i} src={photo} alt="" style={{ display: 'none' }} />
          ))}
        </Image.PreviewGroup>
      ) : (
        <div style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: token.borderRadiusSM,
          border: `0.5px solid ${token.colorBorderSecondary}`,
          background: token.colorFillQuaternary,
          color: iconColors.secondary,
        }}>
          <ImageOff size={16} strokeWidth={2.25} />
        </div>
      )}
      {photoCount > 0 && hovered && (
        // Same colorBgMask/colorTextLightSolid pairing antd's own Image
        // component uses for its hover-to-preview mask — a fixed dark scrim
        // with always-light text, not themed secondary/tertiary text, since
        // it needs to stay readable sitting directly on top of an arbitrary
        // photo in both light and dark mode.
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: token.borderRadiusSM,
          background: token.colorBgMask,
          color: token.colorTextLightSolid,
          fontSize: 12,
          fontWeight: 600,
          pointerEvents: 'none',
        }}>
          +{photoCount}
        </div>
      )}
    </div>
  )
}

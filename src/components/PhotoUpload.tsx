import { Upload, theme } from 'antd'
import type { UploadFile } from 'antd'
import { Plus } from 'lucide-react'
import { ICON_COLOR_SECONDARY } from '../constants/iconColors'

interface Props {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxCount?: number
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// No real backend — files are read as data URLs and kept in-memory on the
// record itself, same convention as the rest of this prototype's mock data.
export function PhotoUpload({ value = [], onChange, maxCount = 4 }: Props) {
  const { token } = theme.useToken()

  const fileList: UploadFile[] = value.map((url, i) => ({
    uid: String(i),
    name: `photo-${i + 1}`,
    status: 'done',
    url,
  }))

  return (
    <div className="ifix-photo-upload">
      <Upload
        listType="picture-card"
        fileList={fileList}
        maxCount={maxCount}
        beforeUpload={async file => {
          const dataUrl = await fileToDataUrl(file as unknown as File)
          onChange?.([...value, dataUrl].slice(0, maxCount))
          return false
        }}
        onRemove={file => {
          const idx = Number(file.uid)
          onChange?.(value.filter((_, i) => i !== idx))
        }}
      >
        {value.length >= maxCount ? null : (
          <div>
            <div style={{ color: ICON_COLOR_SECONDARY }}>
              <Plus size={16} strokeWidth={2.25} />
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: token.colorTextSecondary }}>Upload</div>
          </div>
        )}
      </Upload>
    </div>
  )
}

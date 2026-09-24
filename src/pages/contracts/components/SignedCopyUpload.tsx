import { Button, Typography, Upload, theme } from 'antd'
import { FileText, Image as ImageIcon, Trash2, Upload as UploadIcon } from 'lucide-react'
import type { SignedContractFile } from '../../../types/contract'
import { useIconColors } from '../../../constants/iconColors'

const MAX_FILES = 10

interface Props {
  value?: SignedContractFile[]
  onChange?: (files: SignedContractFile[]) => void
}

function readFile(file: File): Promise<SignedContractFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result as string })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// The signed copy comes back either as one scanned PDF or as a photo per
// page taken at the counter, so this takes both. Files are listed with
// their own rows (rather than antd's default upload list) to keep the file
// and remove icons Lucide like the rest of the app.
export function SignedCopyUpload({ value = [], onChange }: Props) {
  const { token } = theme.useToken()
  const iconColors = useIconColors()

  return (
    <div>
      {value.length < MAX_FILES && (
        <Upload.Dragger
          accept="application/pdf,image/*"
          multiple
          showUploadList={false}
          // antd calls this once per file of a multi-file drop, each with
          // the same `value` — appending one at a time would keep only the
          // last. So the batch's first call reads every file and commits
          // them together; the rest are no-ops.
          beforeUpload={async (file, batch) => {
            if (file !== batch[0]) return false
            const read = await Promise.all(batch.map(f => readFile(f as unknown as File)))
            onChange?.([...value, ...read].slice(0, MAX_FILES))
            return false
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <UploadIcon size={20} strokeWidth={2.25} color={iconColors.secondary} />
            <Typography.Text>Click or drag the signed contract here</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              A PDF, or a photo of each page — up to {MAX_FILES} files
            </Typography.Text>
          </div>
        </Upload.Dragger>
      )}

      {value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
          {value.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 4px 4px 12px',
                borderRadius: token.borderRadius,
                background: token.colorFillQuaternary,
              }}
            >
              <span style={{ display: 'flex', color: iconColors.secondary }}>
                {file.type === 'application/pdf'
                  ? <FileText size={16} strokeWidth={2.25} />
                  : <ImageIcon size={16} strokeWidth={2.25} />}
              </span>
              <Typography.Text ellipsis style={{ flex: 1, minWidth: 0 }}>{file.name}</Typography.Text>
              <Button
                type="text"
                size="small"
                aria-label={`Remove ${file.name}`}
                icon={<Trash2 size={16} strokeWidth={2.25} />}
                onClick={() => onChange?.(value.filter((_, idx) => idx !== i))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

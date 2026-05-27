export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const CHAT_ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf'

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function getChatAttachmentType(file: File): 'pdf' | 'image' | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf'
  if (IMAGE_EXTENSIONS.includes(ext) || IMAGE_MIME_TYPES.includes(file.type)) {
    return 'image'
  }
  return null
}

export function isAllowedChatAttachment(file: File) {
  const type = getChatAttachmentType(file)
  return type !== null && file.size <= CHAT_ATTACHMENT_MAX_BYTES
}

export function formatChatAttachmentSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

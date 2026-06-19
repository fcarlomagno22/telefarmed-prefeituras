import {
  Bold,
  CloudUpload,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CustomSelect } from '../ui/CustomSelect'
import {
  supportTicketCategories,
  type SupportTicketPriority,
} from '../../data/suporteMock'
import { extractPlainTextFromRichHtml } from './supportMessageText'
import { SupportPrioritySelect } from './SupportPrioritySelect'

const MAX_DESCRIPTION_CHARS = 2000
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp']
const ACCEPT_ATTR = '.pdf,.png,.jpg,.jpeg,.webp'

const categoryOptions = [
  { value: '', label: 'Selecione uma categoria' },
  ...supportTicketCategories.map((c) => ({ value: c, label: c })),
]

export type NewSupportTicketPayload = {
  subject: string
  category: string
  priority: SupportTicketPriority
  body: string
  files: File[]
}

type NewSupportTicketDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSubmitted?: () => void
  onSubmit?: (payload: NewSupportTicketPayload) => Promise<void>
  isSubmitting?: boolean
  submitError?: string | null
  tourLockClose?: boolean
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isAllowedFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_EXTENSIONS.includes(ext) && file.size <= MAX_FILE_BYTES
}

export function NewSupportTicketDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSubmitted,
  onSubmit,
  isSubmitting = false,
  submitError = null,
  tourLockClose = false,
}: NewSupportTicketDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<SupportTicketPriority>('media')
  const [subject, setSubject] = useState('')
  const [descriptionLength, setDescriptionLength] = useState(0)
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = useCallback(() => {
    setCategory('')
    setPriority('media')
    setSubject('')
    setDescriptionLength(0)
    setAttachments([])
    setAttachmentError(null)
    if (editorRef.current) {
      editorRef.current.innerHTML = ''
    }
  }, [])

  const isActive = open || closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    resetForm()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, resetForm])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const panelVisible = isActive && entered && !closing

  function syncDescriptionLength() {
    const html = editorRef.current?.innerHTML ?? ''
    setDescriptionLength(extractPlainTextFromRichHtml(html).length)
  }

  function execFormat(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncDescriptionLength()
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files)
    const valid: File[] = []
    let rejected = false

    for (const file of incoming) {
      if (isAllowedFile(file)) {
        valid.push(file)
      } else {
        rejected = true
      }
    }

    if (rejected) {
      setAttachmentError(
        'Alguns arquivos foram ignorados. Use PDF, PNG, JPG, GIF ou MP4 (máx. 10MB).',
      )
    } else {
      setAttachmentError(null)
    }

    if (valid.length > 0) {
      setAttachments((prev) => [...prev, ...valid])
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!category || !subject.trim() || descriptionLength === 0) return
    if (descriptionLength > MAX_DESCRIPTION_CHARS) return
    if (isSubmitting) return

    const plainBody = editorRef.current
      ? extractPlainTextFromRichHtml(editorRef.current.innerHTML)
      : ''
    const payload: NewSupportTicketPayload = {
      subject: subject.trim(),
      category,
      priority,
      body: plainBody,
      files: attachments,
    }

    if (onSubmit) {
      void onSubmit(payload)
      return
    }

    onSubmitted?.()
  }

  const canSubmit =
    category.length > 0 &&
    subject.trim().length > 0 &&
    descriptionLength > 0 &&
    descriptionLength <= MAX_DESCRIPTION_CHARS &&
    !isSubmitting

  if (!isActive) return null

  function handleCloseAttempt(event?: React.SyntheticEvent) {
    if (tourLockClose) {
      event?.preventDefault()
      event?.stopPropagation()
      return
    }
    onClose()
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar novo chamado"
        onClick={handleCloseAttempt}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        data-tour="suporte-new-ticket-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-support-ticket-title"
        onTransitionEnd={(event) => {
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[94vh] max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="new-support-ticket-title" className="text-lg font-bold text-gray-900">
              Dados do chamado
            </h2>
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid shrink-0 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Categoria</FieldLabel>
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                  className="py-2.5"
                  required
                />
              </div>

              <div>
                <FieldLabel required>Prioridade</FieldLabel>
                <SupportPrioritySelect
                  value={priority}
                  onChange={setPriority}
                  className="py-2.5"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel required>Assunto</FieldLabel>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Informe um resumo do problema"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </div>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex min-h-0 flex-1 flex-col">
                <FieldLabel required>Descrição do problema</FieldLabel>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/15">
                  <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50/80 px-2 py-1.5">
                    {(
                      [
                        { icon: Bold, command: 'bold', label: 'Negrito' },
                        { icon: Italic, command: 'italic', label: 'Itálico' },
                        { icon: Underline, command: 'underline', label: 'Sublinhado' },
                        { icon: List, command: 'insertUnorderedList', label: 'Lista' },
                        {
                          icon: ListOrdered,
                          command: 'insertOrderedList',
                          label: 'Lista numerada',
                        },
                      ] as const
                    ).map(({ icon: Icon, command, label }) => (
                      <button
                        key={command}
                        type="button"
                        onClick={() => execFormat(command)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-gray-900"
                        aria-label={label}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('Informe o link (URL):')
                        if (url?.trim()) execFormat('createLink', url.trim())
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-gray-900"
                      aria-label="Inserir link"
                    >
                      <Link2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    role="textbox"
                    aria-multiline
                    aria-label="Descrição do problema"
                    data-placeholder="Descreva com detalhes o que está acontecendo..."
                    onInput={syncDescriptionLength}
                    className="min-h-[14rem] flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] sm:min-h-[16rem]"
                  />

                  <p className="shrink-0 border-t border-gray-200 px-4 py-2 text-right text-xs text-gray-400">
                    <span
                      className={
                        descriptionLength > MAX_DESCRIPTION_CHARS
                          ? 'font-semibold text-red-500'
                          : ''
                      }
                    >
                      {descriptionLength}
                    </span>
                    /{MAX_DESCRIPTION_CHARS} caracteres
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <FieldLabel>Anexos</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT_ATTR}
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />

                <div
                  onDragEnter={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
                  }}
                  className={[
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
                    isDragging
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/40'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300',
                  ].join(' ')}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                    <CloudUpload className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Arraste arquivos aqui ou{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                    >
                      clique para selecionar
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos permitidos: PDF, PNG, JPG, WEBP (máx. 10MB)
                  </p>
                </div>

                {submitError ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{submitError}</p>
                ) : null}

                {attachmentError ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{attachmentError}</p>
                ) : null}

                {attachments.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-gray-700">{file.name}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-600"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--brand-primary-shadow-sm)] transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando…' : 'Enviar chamado'}
            </button>
          </footer>
        </form>
      </aside>
    </div>,
    document.body,
  )
}

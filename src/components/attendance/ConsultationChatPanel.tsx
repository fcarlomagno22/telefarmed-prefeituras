import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Image, Lock, Paperclip, Send } from 'lucide-react'
import { CONSULTATION_CHAT_MOCK } from '../../data/consultationChatMock'
import { ConsultationChatAttachmentPreview } from './ConsultationChatAttachmentViewer'
import {
  formatConsultationAttachmentSize,
  type ConsultationChatAttachment,
  type ConsultationChatMessage,
  type ConsultationChatViewerRole,
} from './consultationChatTypes'
import { patientConsultationCardClass } from './patient/patientConsultationUi'

const ATTACH_OPTIONS = [
  { id: 'photo' as const, label: 'Anexar foto', icon: Image, accept: 'image/png,image/jpeg,image/webp' },
  { id: 'pdf' as const, label: 'Anexar PDF', icon: FileText, accept: 'application/pdf,.pdf' },
]

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function createAttachmentFromFile(
  file: File,
  type: 'image' | 'pdf',
  url: string,
): ConsultationChatAttachment {
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    url,
    name: file.name,
    size: file.size,
  }
}

function formatMessageTime(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export type ConsultationChatPanelProps = {
  viewerRole: ConsultationChatViewerRole
  cardClassName?: string
  className?: string
  messages?: ConsultationChatMessage[]
  readOnly?: boolean
  loading?: boolean
  onSendMessage?: (text: string) => void | Promise<void>
  onSendAttachment?: (attachment: ConsultationChatAttachment) => void | Promise<void>
  /** Preferido com API real — envia o arquivo original sem converter para data URL. */
  onSendAttachmentFile?: (file: File, type: 'image' | 'pdf') => void | Promise<void>
}

export function ConsultationChatPanel({
  viewerRole,
  cardClassName = patientConsultationCardClass,
  className,
  messages: externalMessages,
  readOnly = false,
  loading = false,
  onSendMessage,
  onSendAttachment,
  onSendAttachmentFile,
}: ConsultationChatPanelProps) {
  const [localMessages, setLocalMessages] = useState<ConsultationChatMessage[]>(() => CONSULTATION_CHAT_MOCK)
  const messages = externalMessages ?? localMessages
  const [draft, setDraft] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLLIElement>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!attachOpen) {
      setMenuStyle(null)
      return
    }

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuHeight = menuRef.current?.offsetHeight ?? 0
      const menuWidth = menuRef.current?.offsetWidth ?? 200

      let top = rect.top - 8 - menuHeight
      if (top < 12) top = rect.bottom + 8

      const left = Math.min(Math.max(12, rect.left), window.innerWidth - menuWidth - 12)

      setMenuStyle({ top, left })
    }

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [attachOpen])

  useEffect(() => {
    if (!attachOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setAttachOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAttachOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [attachOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  function appendOwnMessage(message: Omit<ConsultationChatMessage, 'id' | 'from' | 'time'>) {
    if (readOnly || externalMessages) return
    setLocalMessages((current) => [
      ...current,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from: viewerRole,
        time: formatMessageTime(),
        ...message,
      },
    ])
  }

  function handleSendMessage() {
    const text = draft.trim()
    if (!text) return

    if (onSendMessage) {
      void Promise.resolve(onSendMessage(text)).then(() => setDraft(''))
      return
    }

    appendOwnMessage({ text })
    setDraft('')
  }

  function appendAttachmentMessage(attachment: ConsultationChatAttachment) {
    if (onSendAttachment) {
      void Promise.resolve(onSendAttachment(attachment))
      return
    }

    appendOwnMessage({ attachments: [attachment] })
  }

  function handleFileSelected(type: 'image' | 'pdf', file: File | undefined) {
    if (!file) return
    setAttachOpen(false)

    if (onSendAttachmentFile) {
      void Promise.resolve(onSendAttachmentFile(file, type))
      return
    }

    void fileToDataUrl(file)
      .then((url) => appendAttachmentMessage(createAttachmentFromFile(file, type, url)))
      .catch(() => {
        // Falha silenciosa — o usuário pode tentar anexar novamente.
      })
  }

  const attachMenu =
    attachOpen && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
            style={{ top: menuStyle.top, left: menuStyle.left }}
            role="menu"
          >
            {ATTACH_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                onClick={() => {
                  setAttachOpen(false)
                  if (id === 'photo') photoInputRef.current?.click()
                  else pdfInputRef.current?.click()
                }}
              >
                <Icon className="h-4 w-4 text-gray-500" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <section className={[cardClassName, 'min-h-0', className].filter(Boolean).join(' ')}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFileSelected('image', event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          handleFileSelected('pdf', event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <div className="shrink-0 border-b border-gray-100 px-4 py-3.5">
        <h2 className="text-sm font-bold text-gray-900">Chat da consulta</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
          <Lock className="h-3 w-3" strokeWidth={2} />
          As mensagens são seguras e criptografadas
        </p>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {loading && messages.length === 0 ? (
          <li className="py-6 text-center text-sm text-gray-500">Carregando mensagens…</li>
        ) : null}
        {messages.map((message) => {
          const isOwn = message.from === viewerRole
          const hasText = Boolean(message.text?.trim())
          const attachments = message.attachments ?? []

          return (
            <li
              key={message.id}
              className={['flex flex-col gap-1', isOwn ? 'items-end' : 'items-start'].join(' ')}
            >
              {(hasText || attachments.length > 0) && (
                <div
                  className={[
                    'max-w-[92%] rounded-2xl shadow-sm',
                    isOwn
                      ? 'rounded-br-md bg-[#FFF0E6] text-gray-900'
                      : 'rounded-bl-md border border-gray-100 bg-white text-gray-800',
                    hasText && attachments.length > 0 ? 'px-3.5 py-2.5' : '',
                    !hasText && attachments.length > 0 ? 'p-1.5' : '',
                    hasText && attachments.length === 0 ? 'px-3.5 py-2.5 text-sm leading-snug' : '',
                  ].join(' ')}
                >
                  {hasText ? (
                    <p className={attachments.length > 0 ? 'mb-2 text-sm leading-snug' : 'text-sm leading-snug'}>
                      {message.text}
                    </p>
                  ) : null}

                  {attachments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {attachments.map((attachment) => (
                        <ConsultationChatAttachmentPreview
                          key={attachment.id}
                          attachment={attachment}
                          align={isOwn ? 'end' : 'start'}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {attachments.some((item) => item.size) && !hasText ? (
                <span className="px-1 text-[10px] font-medium text-gray-400">
                  {attachments
                    .map((item) => formatConsultationAttachmentSize(item.size))
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}

              <span className="px-1 text-[10px] font-medium text-gray-400">{message.time}</span>
            </li>
          )
        })}
        <li ref={messagesEndRef} className="h-0 shrink-0" aria-hidden />
      </ul>

      {readOnly ? (
        <div className="shrink-0 border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-500">
          Chat somente leitura.
        </div>
      ) : (
      <div className="shrink-0 border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setAttachOpen((open) => !open)}
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
              attachOpen
                ? 'border-[var(--brand-primary)] bg-orange-50 text-[var(--brand-primary)]'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ].join(' ')}
            aria-label="Anexar arquivo"
            aria-expanded={attachOpen}
            aria-haspopup="menu"
          >
            <Paperclip className="h-4 w-4" strokeWidth={2} />
          </button>

          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return
              event.preventDefault()
              handleSendMessage()
            }}
            placeholder="Digite sua mensagem..."
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!draft.trim()}
            className="btn-brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:cursor-not-allowed"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      )}

      {attachMenu}
    </section>
  )
}

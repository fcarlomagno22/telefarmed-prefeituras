import {
  AlertCircle,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  Paperclip,
  Pencil,
  RotateCcw,
  Send,
  Square,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  SupportMessage,
  SupportMessageAttachment,
  SupportMessageDeletedSnapshot,
  SupportTicket,
} from '../../data/suporteMock'
import { brand } from '../../config/brand'
import { getLoggedOperatorName } from '../../utils/sessionUser'
import { SupportTicketCloseConfirmModal } from './SupportTicketCloseConfirmModal'
import {
  SUPPORT_SOURCE_BADGE_WIDTH,
  supportSourceBadgeConfig,
} from './supportSourceBadgeConfig'
import { SituationStatusBadge } from '../ui/SituationStatusBadge'
import { Toast } from '../ui/Toast'
import {
  CHAT_ATTACHMENT_ACCEPT,
  formatChatAttachmentSize,
  getChatAttachmentType,
  isAllowedChatAttachment,
} from './supportChatAttachments'
import { ConsultationChatAttachmentViewer } from '../attendance/ConsultationChatAttachmentViewer'
import {
  isSupportMediaOverlayOpen,
  SupportChatImageLightbox,
} from './SupportChatImageLightbox'
import { SupportMessageBody } from './supportMessageText'
import { supportTicketStatusBadgeConfig } from './supportStatusBadgeConfig'

const TYPING_DELAY_MS = 2200
const MESSAGE_LONG_PRESS_MS = 600
const DELETE_UNDO_MS = 10000
const MESSAGE_HIGHLIGHT_MS = 2000
const DELETED_MESSAGE_LABEL = 'Mensagem apagada'
const GENERIC_SUPPORT_REPLY =
  'Obrigado pela mensagem! Recebemos sua solicitação e nossa equipe de suporte já está analisando. Em breve retornaremos com mais informações.'

function countOperatorMessages(messages: SupportMessage[]) {
  return messages.filter((message) => message.author === 'operator' && !message.deleted).length
}

function hasGenericSupportAck(messages: SupportMessage[]) {
  return messages.some((message) => message.body === GENERIC_SUPPORT_REPLY && !message.deleted)
}

function shouldSendGenericSupportAck(messages: SupportMessage[], includePendingOperator = false) {
  const operatorCount = countOperatorMessages(messages) + (includePendingOperator ? 1 : 0)
  return operatorCount === 1 && !hasGenericSupportAck(messages)
}

type SupportTicketDrawerApiHandlers = {
  onSendReply: (body: string, files: File[]) => Promise<SupportTicket>
  onEditMessage: (messageId: string, body: string) => Promise<SupportTicket>
  onDeleteMessage: (messageId: string) => Promise<SupportTicket>
  onCloseTicket: () => Promise<SupportTicket>
  onError?: (message: string) => void
}

type SupportTicketDrawerProps = {
  ticket: SupportTicket | null
  open: boolean
  closing: boolean
  readOnly?: boolean
  isLoading?: boolean
  /** Resposta da equipe Telefarmed (painel admin). */
  replyAsSupport?: boolean
  /** Enviar novas mensagens no chat (padrão: !readOnly e chamado aberto). */
  canReply?: boolean
  /** Editar, excluir ou selecionar mensagens próprias (padrão: !readOnly). */
  canManageMessages?: boolean
  /** Encerrar chamado no painel admin (padrão: replyAsSupport e chamado aberto). */
  canCloseTicket?: boolean
  supportApi?: SupportTicketDrawerApiHandlers
  onTicketUpdate?: (ticket: SupportTicket) => void
  onClose: () => void
  onTransitionEnd: () => void
  tourLockClose?: boolean
}

type PendingChatFile = {
  id: string
  file: File
  type: 'pdf' | 'image'
  previewUrl: string | null
}

function formatMessageTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '')
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createPendingMessageId() {
  return `pending-${createMessageId()}`
}

function isOutboundDeliveryStatus(
  status: SupportMessage['deliveryStatus'],
): status is 'pending' | 'failed' {
  return status === 'pending' || status === 'failed'
}

function messageContentMatches(a: SupportMessage, b: SupportMessage) {
  if (a.author !== b.author) return false
  if (a.body.trim() !== b.body.trim()) return false
  return (a.attachments?.length ?? 0) === (b.attachments?.length ?? 0)
}

function mergeServerMessagesWithOptimistic(
  local: SupportMessage[],
  server: SupportMessage[],
): SupportMessage[] {
  const outbound = local.filter((message) => isOutboundDeliveryStatus(message.deliveryStatus))
  if (outbound.length === 0) return [...server]

  const stillOutbound = outbound.filter((optimistic) => {
    if (optimistic.deliveryStatus === 'failed') return true
    return !server.some((serverMessage) => messageContentMatches(optimistic, serverMessage))
  })

  return [...server, ...stillOutbound]
}

async function attachmentsToFiles(
  attachments: SupportMessageAttachment[] | undefined,
): Promise<File[]> {
  if (!attachments?.length) return []

  const files: File[] = []
  for (const attachment of attachments) {
    if (!attachment.url.startsWith('blob:')) continue
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      files.push(
        new File([blob], attachment.name, {
          type: blob.type || (attachment.type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        }),
      )
    } catch {
      return []
    }
  }

  return files.length === attachments.length ? files : []
}

function revokeMessageAttachmentUrls(messages: SupportMessage[]) {
  for (const message of messages) {
    message.attachments?.forEach((attachment) => {
      if (attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url)
      }
    })
  }
}

function revokePendingPreviews(files: PendingChatFile[]) {
  for (const pending of files) {
    if (pending.previewUrl) {
      URL.revokeObjectURL(pending.previewUrl)
    }
  }
}

function ChatImageThumbnail({ attachment }: { attachment: SupportMessageAttachment }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group block overflow-hidden rounded-lg border border-gray-200/80 transition hover:border-[var(--brand-primary)]/40 hover:ring-2 hover:ring-[var(--brand-primary)]/20"
        aria-label={`Abrir imagem ${attachment.name}`}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-24 w-24 object-cover transition group-hover:brightness-95 sm:h-28 sm:w-28"
        />
      </button>
      {lightboxOpen ? (
        <SupportChatImageLightbox
          url={attachment.url}
          name={attachment.name}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </>
  )
}

function ChatPdfAttachment({ attachment }: { attachment: SupportMessageAttachment }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200/80 bg-white/60 px-3 py-2 text-left transition hover:border-[var(--brand-primary)]/30 hover:bg-white"
        aria-label={`Visualizar PDF ${attachment.name}`}
      >
        <FileText className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
        <span className="min-w-0">
          <span className="block max-w-[180px] truncate text-xs font-medium text-gray-700 sm:max-w-[220px]">
            {attachment.name}
          </span>
          <span className="text-[10px] text-gray-400">
            PDF · Toque para visualizar
            {attachment.size > 0 ? ` · ${formatChatAttachmentSize(attachment.size)}` : ''}
          </span>
        </span>
      </button>
      {viewerOpen ? (
        <ConsultationChatAttachmentViewer
          attachment={{
            id: attachment.id,
            type: 'pdf',
            url: attachment.url,
            name: attachment.name,
            size: attachment.size,
          }}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  )
}

function MessageAttachments({ attachments }: { attachments: SupportMessageAttachment[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) =>
        attachment.type === 'image' ? (
          <ChatImageThumbnail key={attachment.id} attachment={attachment} />
        ) : (
          <ChatPdfAttachment key={attachment.id} attachment={attachment} />
        ),
      )}
    </div>
  )
}

function getSupportAgentName() {
  return brand.adminOperatorName
}

function isOwnAgentMessage(message: SupportMessage, replyAsSupport: boolean) {
  if (replyAsSupport) {
    return (
      message.author === 'support' &&
      (message.authorName === getSupportAgentName() ||
        message.authorName === 'Suporte Telefarmed')
    )
  }
  return message.author === 'operator' && message.authorName === getLoggedOperatorName()
}

function isSelectableOwnMessage(message: SupportMessage, replyAsSupport: boolean) {
  return (
    isOwnAgentMessage(message, replyAsSupport) &&
    !message.deleted &&
    message.deliveryStatus !== 'pending'
  )
}

function MessageDeliveryStatus({
  status,
  onRetry,
}: {
  status: SupportMessage['deliveryStatus']
  onRetry?: () => void
}) {
  if (!status || status === 'sent') {
    return (
      <span className="inline-flex items-center text-gray-400" aria-label="Enviada">
        <CheckCheck className="h-3 w-3" strokeWidth={2.25} />
      </span>
    )
  }

  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400" aria-label="Enviando">
        <Clock className="h-3 w-3 animate-pulse" strokeWidth={2.25} />
        <span>Enviando…</span>
      </span>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-red-500">
      <span className="inline-flex items-center gap-1">
        <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2.25} />
        <span>Falha ao enviar</span>
      </span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-semibold text-red-600 transition hover:bg-red-50"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2.25} />
          Tentar novamente
        </button>
      ) : null}
    </span>
  )
}

function isSupportPartnerMessage(message: SupportMessage) {
  return message.author === 'support' && !message.deleted
}

function getMessageExcerpt(message: SupportMessage, maxLength = 72) {
  const text = message.body.trim()
  if (text) {
    return text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}…`
  }
  if (message.attachments?.length) {
    const hasImage = message.attachments.some((item) => item.type === 'image')
    const hasPdf = message.attachments.some((item) => item.type === 'pdf')
    if (hasImage && hasPdf) return 'Anexos: imagem e PDF'
    if (hasImage) return 'Imagem anexada'
    return 'PDF anexado'
  }
  return 'Mensagem sem texto'
}

function createDeletedSnapshot(message: SupportMessage): SupportMessageDeletedSnapshot {
  return {
    body: message.body,
    editedAt: message.editedAt,
    attachments: message.attachments,
  }
}

function revokeSnapshotAttachments(snapshot: SupportMessageDeletedSnapshot | undefined) {
  snapshot?.attachments?.forEach((attachment) => {
    if (attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }
  })
}

function isMessageBodyTextTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return target.closest('[data-message-body]') !== null
}

function canStartMessageLongPress(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  if (isMessageBodyTextTarget(target)) return false
  if (target.closest('button, a, textarea, input, [role="menu"]')) return false
  return true
}

type MessageBubbleProps = {
  message: SupportMessage
  selectionMode: boolean
  isSelected: boolean
  onToggleSelect: () => void
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  isEditing: boolean
  editDraft: string
  onEditDraftChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onEnterSelectionMode?: () => void
  onRetrySend?: () => void
}

function MessageBubble({
  message,
  selectionMode,
  isSelected,
  onToggleSelect,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEnterSelectionMode,
  onRetrySend,
  replyAsSupport = false,
}: MessageBubbleProps & { replyAsSupport?: boolean }) {
  const isSupport = message.author === 'support'
  const isOwn = isOwnAgentMessage(message, replyAsSupport)
  const isDeleted = message.deleted === true
  const isPending = message.deliveryStatus === 'pending'
  const hasBody = message.body.trim().length > 0
  const hasAttachments = (message.attachments?.length ?? 0) > 0
  const canEditText = hasBody && !isPending && message.deliveryStatus !== 'failed'
  const menuRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<number | null>(null)

  if (isDeleted) {
    return (
      <article
        className={[
          'support-message-in w-fit max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm sm:max-w-[min(100%,34rem)]',
          isSupport
            ? 'bg-gray-100 text-gray-800'
            : 'bg-[var(--brand-primary-light)]/80 text-gray-800',
        ].join(' ')}
      >
        <p className="text-xs font-semibold text-gray-600">{message.authorName}</p>
        <p className="mt-1 text-sm italic text-gray-500">{DELETED_MESSAGE_LABEL}</p>
        <p className="mt-2 text-[10px] font-medium text-gray-400">{message.sentAt}</p>
      </article>
    )
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  useEffect(() => () => clearLongPressTimer(), [])

  function handleCardPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!isOwn || isDeleted || selectionMode || isEditing || !onEnterSelectionMode) return
    if (!canStartMessageLongPress(event.target)) return

    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      onEnterSelectionMode()
      longPressTimerRef.current = null
    }, MESSAGE_LONG_PRESS_MS)
  }

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onCloseMenu()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMenu()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen, onCloseMenu])

  return (
    <article
      onPointerDown={handleCardPointerDown}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onPointerCancel={clearLongPressTimer}
      onContextMenu={(event) => {
        if (isOwn && !selectionMode && canStartMessageLongPress(event.target)) {
          event.preventDefault()
        }
      }}
      className={[
        'support-message-in relative w-fit max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm sm:max-w-[min(100%,34rem)]',
        isSupport
          ? 'bg-gray-100 text-gray-800'
          : 'bg-[var(--brand-primary-light)] text-gray-800',
        selectionMode && isSelected ? 'ring-2 ring-[var(--brand-primary)]/35' : '',
        isOwn && !selectionMode && !isEditing ? 'select-none' : '',
        isPending ? 'opacity-90' : '',
        message.deliveryStatus === 'failed' ? 'ring-1 ring-red-200/80' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-semibold text-gray-600">{message.authorName}</p>
        {isOwn && !isDeleted && !isEditing && !selectionMode && !isPending ? (
          <div ref={menuRef} className="relative -mr-1 shrink-0">
            <button
              type="button"
              onClick={onToggleMenu}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Opções da mensagem"
              className={[
                'flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition hover:bg-white/60 hover:text-gray-700',
                menuOpen ? 'bg-white/60 text-gray-700' : '',
              ].join(' ')}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                aria-label="Ações da mensagem"
                className="absolute right-0 top-[calc(100%+0.25rem)] z-20 min-w-[9.5rem] overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!canEditText}
                  onClick={() => {
                    onCloseMenu()
                    onStartEdit()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  Editar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCloseMenu()
                    onDelete()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  Excluir
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editDraft}
            onChange={(event) => onEditDraftChange(event.target.value)}
            rows={3}
            autoFocus
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={!editDraft.trim()}
              className="rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <>
          {hasBody ? (
            <SupportMessageBody
              body={message.body}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ) : null}
          {hasAttachments ? <MessageAttachments attachments={message.attachments!} /> : null}
        </>
      )}

      {!isEditing ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-[10px] font-medium text-gray-400">
            {message.sentAt}
            {message.editedAt ? (
              <span className="text-gray-400"> · editada {message.editedAt}</span>
            ) : null}
          </p>
          {isOwn ? (
            <MessageDeliveryStatus
              status={message.deliveryStatus ?? 'sent'}
              onRetry={message.deliveryStatus === 'failed' ? onRetrySend : undefined}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function MessageSelectCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--brand-primary)] transition hover:bg-gray-100"
    >
      {checked ? (
        <CheckSquare className="h-5 w-5" strokeWidth={2} />
      ) : (
        <Square className="h-5 w-5 text-gray-400" strokeWidth={2} />
      )}
    </button>
  )
}

function ReadOnlyMessageBubble({ message }: { message: SupportMessage }) {
  const isSupport = message.author === 'support'
  const isDeleted = message.deleted === true
  const hasBody = message.body.trim().length > 0
  const hasAttachments = (message.attachments?.length ?? 0) > 0

  if (isDeleted) {
    return (
      <article
        className={[
          'support-message-in w-fit max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm sm:max-w-[min(100%,34rem)]',
          isSupport ? 'bg-gray-100 text-gray-800' : 'bg-[var(--brand-primary-light)]/80 text-gray-800',
        ].join(' ')}
      >
        <p className="text-xs font-semibold text-gray-600">{message.authorName}</p>
        <p className="mt-1 text-sm italic text-gray-500">{DELETED_MESSAGE_LABEL}</p>
        <p className="mt-2 text-[10px] font-medium text-gray-400">{message.sentAt}</p>
      </article>
    )
  }

  return (
    <article
      className={[
        'support-message-in w-fit max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm sm:max-w-[min(100%,34rem)]',
        isSupport ? 'bg-gray-100 text-gray-800' : 'bg-[var(--brand-primary-light)] text-gray-800',
      ].join(' ')}
    >
      <p className="text-xs font-semibold text-gray-600">{message.authorName}</p>
      {hasBody ? <SupportMessageBody body={message.body} /> : null}
      {hasAttachments ? <MessageAttachments attachments={message.attachments!} /> : null}
      <p className="mt-2 text-[10px] font-medium text-gray-400">{message.sentAt}</p>
    </article>
  )
}

function SupportMessageBubble({
  message,
  selectionMode,
  isSelected,
  onToggleSelect,
  menuOpenId,
  editingId,
  editDraft,
  onToggleMenu,
  onCloseMenu,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEnterSelectionMode,
  onRetrySend,
  isFavorited,
  onToggleFavorite,
  isHighlighted,
  cardRef,
  readOnly = false,
  replyAsSupport = false,
}: {
  message: SupportMessage
  selectionMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEnterSelectionMode: (messageId: string) => void
  isFavorited: boolean
  onToggleFavorite: () => void
  isHighlighted: boolean
  cardRef?: (element: HTMLElement | null) => void
  menuOpenId: string | null
  editingId: string | null
  editDraft: string
  onToggleMenu: (id: string) => void
  onCloseMenu: () => void
  onEditDraftChange: (value: string) => void
  onStartEdit: (message: SupportMessage) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: (id: string) => void
  onRetrySend?: (message: SupportMessage) => void
  readOnly?: boolean
  replyAsSupport?: boolean
}) {
  if (readOnly) {
    return <ReadOnlyMessageBubble message={message} />
  }

  if (isOwnAgentMessage(message, replyAsSupport)) {
    const bubble = (
      <MessageBubble
        message={message}
        replyAsSupport={replyAsSupport}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onToggleSelect={() => onToggleSelect(message.id)}
        menuOpen={menuOpenId === message.id}
        onToggleMenu={() => onToggleMenu(message.id)}
        onCloseMenu={onCloseMenu}
        isEditing={editingId === message.id}
        editDraft={editDraft}
        onEditDraftChange={onEditDraftChange}
        onStartEdit={() => onStartEdit(message)}
        onCancelEdit={onCancelEdit}
        onSaveEdit={onSaveEdit}
        onDelete={() => onDelete(message.id)}
        onRetrySend={onRetrySend ? () => onRetrySend(message) : undefined}
        onEnterSelectionMode={
          !selectionMode
            ? () => onEnterSelectionMode(message.id)
            : undefined
        }
      />
    )

    if (!selectionMode || message.deleted) return bubble

    return (
      <div className="flex items-start gap-2">
        <MessageSelectCheckbox
          checked={isSelected}
          onChange={() => onToggleSelect(message.id)}
          label={isSelected ? 'Desmarcar mensagem' : 'Selecionar mensagem'}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleSelect(message.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onToggleSelect(message.id)
            }
          }}
          className="min-w-0 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
        >
          {bubble}
        </div>
      </div>
    )
  }

  if (isSupportPartnerMessage(message)) {
    return (
      <SupportPartnerMessageBubble
        message={message}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
        isHighlighted={isHighlighted}
        cardRef={cardRef}
      />
    )
  }

  const hasBody = message.body.trim().length > 0
  const hasAttachments = (message.attachments?.length ?? 0) > 0

  return (
    <article
      className="support-message-in w-fit max-w-[min(100%,28rem)] rounded-2xl bg-[var(--brand-primary-light)] px-4 py-3 text-sm text-gray-800 sm:max-w-[min(100%,34rem)]"
    >
      <p className="text-xs font-semibold text-gray-600">{message.authorName}</p>
      {hasBody ? <SupportMessageBody body={message.body} /> : null}
      {hasAttachments ? <MessageAttachments attachments={message.attachments!} /> : null}
      <p className="mt-2 text-[10px] font-medium text-gray-400">{message.sentAt}</p>
    </article>
  )
}

function SupportPartnerMessageBubble({
  message,
  isFavorited,
  onToggleFavorite,
  isHighlighted,
  cardRef,
}: {
  message: SupportMessage
  isFavorited: boolean
  onToggleFavorite: () => void
  isHighlighted: boolean
  cardRef?: (element: HTMLElement | null) => void
}) {
  const hasBody = message.body.trim().length > 0
  const hasAttachments = (message.attachments?.length ?? 0) > 0

  return (
    <article
      ref={cardRef}
      className={[
        'support-message-in w-fit max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm sm:max-w-[min(100%,34rem)]',
        'bg-gray-100 text-gray-800',
        isHighlighted ? 'support-message-blink' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-semibold text-gray-600">{message.authorName}</p>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar mensagem'}
          aria-pressed={isFavorited}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/70 hover:text-amber-500"
        >
          <Star
            className={`h-4 w-4 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`}
            strokeWidth={2}
          />
        </button>
      </div>
      {hasBody ? <SupportMessageBody body={message.body} /> : null}
      {hasAttachments ? <MessageAttachments attachments={message.attachments!} /> : null}
      <p className="mt-2 text-[10px] font-medium text-gray-400">{message.sentAt}</p>
    </article>
  )
}

function SupportFavoritesPanel({
  favorites,
  onSelect,
  onClose,
}: {
  favorites: SupportMessage[]
  onSelect: (messageId: string) => void
  onClose: () => void
}) {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-amber-50/40">
      <div className="flex items-center justify-between gap-2 px-5 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" strokeWidth={2} />
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
            Mensagens favoritas
          </h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            {favorites.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-gray-500 transition hover:text-gray-800"
        >
          Fechar
        </button>
      </div>
      {favorites.length === 0 ? (
        <p className="px-5 pb-4 text-xs text-gray-500 sm:px-6">
          Nenhuma mensagem favoritada. Toque na estrela em uma resposta do suporte para salvar aqui.
        </p>
      ) : (
        <ul className="max-h-44 space-y-1 overflow-y-auto px-3 pb-3 sm:px-4">
          {favorites.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => onSelect(message.id)}
                className="flex w-full flex-col rounded-xl border border-transparent bg-white/80 px-3 py-2.5 text-left transition hover:border-amber-200/80 hover:bg-white hover:shadow-sm"
              >
                <span className="line-clamp-2 text-sm leading-snug text-gray-800">
                  {getMessageExcerpt(message)}
                </span>
                <span className="mt-1 text-[10px] font-medium text-gray-400">
                  {message.authorName} · {message.sentAt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <article
      className="w-fit max-w-[min(100%,28rem)] rounded-2xl bg-gray-100 px-4 py-3 text-sm sm:max-w-[min(100%,34rem)]"
      aria-live="polite"
      aria-label="Suporte está digitando"
    >
      <p className="text-xs font-semibold text-gray-600">Suporte Telefarmed</p>
      <div className="mt-2.5 flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-2 w-2 rounded-full bg-gray-400"
            style={{
              animation: 'support-typing-bounce 1.2s ease-in-out infinite',
              animationDelay: `${index * 0.18}s`,
            }}
          />
        ))}
      </div>
    </article>
  )
}

export function SupportTicketDrawer({
  ticket,
  open,
  closing,
  readOnly = false,
  isLoading = false,
  replyAsSupport = false,
  canReply: canReplyProp,
  canManageMessages: canManageMessagesProp,
  canCloseTicket: canCloseTicketProp,
  supportApi,
  onTicketUpdate,
  onClose,
  onTransitionEnd,
  tourLockClose = false,
}: SupportTicketDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [ticketStatus, setTicketStatus] = useState<SupportTicket['status']>('em_andamento')
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingChatFile[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteToast, setDeleteToast] = useState<{ message: string } | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoritesPanelOpen, setFavoritesPanelOpen] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const typingTimeoutRef = useRef<number | null>(null)
  const deleteUndoTimeoutRef = useRef<number | null>(null)
  const highlightTimeoutRef = useRef<number | null>(null)
  const pendingUndoIdsRef = useRef<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isActive = open || closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    if (ticket) {
      setMessages([...(ticket.messages ?? [])])
      setTicketStatus(ticket.status)
    }
    setCloseConfirmOpen(false)
    setReply('')
    setAttachmentError(null)
    setPendingFiles((prev) => {
      revokePendingPreviews(prev)
      return []
    })
    setIsTyping(false)
    setIsSending(false)
    setMenuOpenId(null)
    setEditingId(null)
    setEditDraft('')
    setSelectionMode(false)
    setSelectedIds([])
    setFavoriteIds([])
    setFavoritesPanelOpen(false)
    setHighlightedMessageId(null)
    messageRefs.current.clear()

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, ticket?.id])

  useEffect(() => {
    if (!open || !ticket || isLoading) return
    setMessages((current) => mergeServerMessagesWithOptimistic(current, ticket.messages ?? []))
    setTicketStatus(ticket.status)
  }, [isLoading, open, ticket])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (isSupportMediaOverlayOpen()) return
      if (selectionMode) {
        exitSelectionMode()
        return
      }
      onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, selectionMode])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  useEffect(() => {
    if (!open) {
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      setIsTyping(false)
      setIsSending(false)
      setMessages((prev) => {
        revokeMessageAttachmentUrls(prev)
        return []
      })
      setPendingFiles((prev) => {
        revokePendingPreviews(prev)
        return []
      })
      setMenuOpenId(null)
      setEditingId(null)
      setEditDraft('')
      setSelectionMode(false)
      setSelectedIds([])
      setDeleteToast(null)
      setFavoriteIds([])
      setFavoritesPanelOpen(false)
      setHighlightedMessageId(null)
      messageRefs.current.clear()
      pendingUndoIdsRef.current = []
      if (deleteUndoTimeoutRef.current !== null) {
        window.clearTimeout(deleteUndoTimeoutRef.current)
        deleteUndoTimeoutRef.current = null
      }
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current)
        highlightTimeoutRef.current = null
      }
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, pendingFiles])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current)
      }
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  const favoriteMessages = messages.filter(
    (message) => favoriteIds.includes(message.id) && isSupportPartnerMessage(message),
  )

  function handleToggleFavorite(messageId: string) {
    setFavoriteIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId],
    )
  }

  function startMessageBlink(messageId: string) {
    setHighlightedMessageId(null)

    requestAnimationFrame(() => {
      setHighlightedMessageId(messageId)

      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current)
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedMessageId(null)
        highlightTimeoutRef.current = null
      }, MESSAGE_HIGHLIGHT_MS)
    })
  }

  function scrollToMessage(messageId: string) {
    const target = messageRefs.current.get(messageId)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleNavigateToFavorite(messageId: string) {
    setFavoritesPanelOpen(false)
    exitSelectionMode()

    window.setTimeout(() => {
      scrollToMessage(messageId)
      startMessageBlink(messageId)
    }, 150)
  }

  const panelVisible = isActive && entered && !closing
  const canSend = (reply.trim().length > 0 || pendingFiles.length > 0) && !isTyping

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files)
    const valid: PendingChatFile[] = []
    let rejected = false

    for (const file of incoming) {
      if (!isAllowedChatAttachment(file)) {
        rejected = true
        continue
      }
      const type = getChatAttachmentType(file)
      if (!type) {
        rejected = true
        continue
      }
      valid.push({
        id: createMessageId(),
        file,
        type,
        previewUrl: type === 'image' ? URL.createObjectURL(file) : null,
      })
    }

    if (rejected) {
      setAttachmentError(
        'Alguns arquivos foram ignorados. Envie apenas PDF ou imagem (PNG, JPG, WEBP) com até 10MB.',
      )
    } else {
      setAttachmentError(null)
    }

    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid])
    }
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => {
      const target = prev.find((file) => file.id === id)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((file) => file.id !== id)
    })
  }

  function buildAttachmentsFromPending(): SupportMessageAttachment[] {
    return pendingFiles.map((pending) => ({
      id: pending.id,
      name: pending.file.name,
      type: pending.type,
      url:
        pending.previewUrl ??
        URL.createObjectURL(pending.file),
      size: pending.file.size,
    }))
  }

  function revokeMessageAttachments(message: SupportMessage) {
    message.attachments?.forEach((attachment) => {
      if (attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url)
      }
    })
  }

  function handleToggleMenu(messageId: string) {
    setMenuOpenId((current) => (current === messageId ? null : messageId))
  }

  function handleCloseMenu() {
    setMenuOpenId(null)
  }

  function handleStartEdit(message: SupportMessage) {
    setEditingId(message.id)
    setEditDraft(message.body)
    setMenuOpenId(null)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  function handleSaveEdit() {
    const text = editDraft.trim()
    if (!editingId || !text) return

    if (supportApi) {
      void (async () => {
        try {
          const updated = await supportApi.onEditMessage(editingId, text)
          setMessages([...updated.messages])
          setTicketStatus(updated.status)
          onTicketUpdate?.(updated)
          setEditingId(null)
          setEditDraft('')
        } catch (error) {
          supportApi.onError?.(
            error instanceof Error ? error.message : 'Não foi possível editar a mensagem.',
          )
        }
      })()
      return
    }

    setMessages((prev) =>
      prev.map((message) =>
        message.id === editingId
          ? {
              ...message,
              body: text,
              editedAt: formatMessageTime(new Date()),
            }
          : message,
      ),
    )
    setEditingId(null)
    setEditDraft('')
  }

  const ownMessageIds = messages
    .filter((message) => isSelectableOwnMessage(message, replyAsSupport))
    .map((message) => message.id)
  const selectedCount = selectedIds.length
  const allOwnSelected =
    ownMessageIds.length > 0 && ownMessageIds.every((id) => selectedIds.includes(id))

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds([])
    setMenuOpenId(null)
    setEditingId(null)
    setEditDraft('')
  }

  function enterSelectionMode(initialMessageId?: string) {
    setSelectionMode(true)
    setSelectedIds(initialMessageId ? [initialMessageId] : [])
    setMenuOpenId(null)
    setEditingId(null)
    setEditDraft('')
  }

  function handleToggleSelect(messageId: string) {
    setSelectedIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId],
    )
  }

  function handleToggleSelectAll() {
    if (allOwnSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds([...ownMessageIds])
  }

  const clearDeleteUndoTimer = useCallback(() => {
    if (deleteUndoTimeoutRef.current !== null) {
      window.clearTimeout(deleteUndoTimeoutRef.current)
      deleteUndoTimeoutRef.current = null
    }
  }, [])

  const commitDeletedMessages = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    setMessages((prev) => {
      prev.forEach((message) => {
        if (idSet.has(message.id)) {
          revokeSnapshotAttachments(message.deletedSnapshot)
        }
      })
      return prev.map((message) =>
        idSet.has(message.id)
          ? { ...message, deletedSnapshot: undefined }
          : message,
      )
    })
  }, [])

  const handleDeleteToastClose = useCallback(() => {
    clearDeleteUndoTimer()
    if (pendingUndoIdsRef.current.length > 0) {
      commitDeletedMessages(pendingUndoIdsRef.current)
      pendingUndoIdsRef.current = []
    }
    setDeleteToast(null)
  }, [clearDeleteUndoTimer, commitDeletedMessages])

  const handleUndoDelete = useCallback(() => {
    clearDeleteUndoTimer()
    const ids = new Set(pendingUndoIdsRef.current)
    pendingUndoIdsRef.current = []
    setMessages((prev) =>
      prev.map((message) => {
        if (!ids.has(message.id) || !message.deletedSnapshot) return message
        const snapshot = message.deletedSnapshot
        return {
          ...message,
          deleted: false,
          body: snapshot.body,
          editedAt: snapshot.editedAt,
          attachments: snapshot.attachments,
          deletedSnapshot: undefined,
        }
      }),
    )
    setDeleteToast(null)
  }, [clearDeleteUndoTimer])

  function softDeleteMessages(rawIds: string[]) {
    if (supportApi) {
      const localOnlyIds = rawIds.filter((messageId) => {
        const message = messages.find((item) => item.id === messageId)
        return message != null && isOutboundDeliveryStatus(message.deliveryStatus)
      })
      const serverIds = rawIds.filter((messageId) => !localOnlyIds.includes(messageId))

      if (localOnlyIds.length > 0) {
        setMessages((prev) => {
          prev.forEach((message) => {
            if (localOnlyIds.includes(message.id)) {
              revokeMessageAttachments(message)
            }
          })
          return prev.filter((message) => !localOnlyIds.includes(message.id))
        })
        if (editingId && localOnlyIds.includes(editingId)) {
          setEditingId(null)
          setEditDraft('')
        }
        setMenuOpenId(null)
        exitSelectionMode()
      }

      if (serverIds.length === 0) return

      void (async () => {
        try {
          let updated = ticket!
          for (const messageId of serverIds) {
            updated = await supportApi.onDeleteMessage(messageId)
          }
          setMessages((current) =>
            mergeServerMessagesWithOptimistic(
              current.filter((message) => !localOnlyIds.includes(message.id)),
              updated.messages,
            ),
          )
          setTicketStatus(updated.status)
          onTicketUpdate?.(updated)
          if (editingId && serverIds.includes(editingId)) {
            setEditingId(null)
            setEditDraft('')
          }
          setMenuOpenId(null)
          exitSelectionMode()
        } catch (error) {
          supportApi.onError?.(
            error instanceof Error ? error.message : 'Não foi possível excluir a mensagem.',
          )
        }
      })()
      return
    }

    if (pendingUndoIdsRef.current.length > 0) {
      commitDeletedMessages(pendingUndoIdsRef.current)
      pendingUndoIdsRef.current = []
      clearDeleteUndoTimer()
    }

    let deletedCount = 0
    setMessages((prev) => {
      const idSet = new Set(
        rawIds.filter((id) => {
          const message = prev.find((item) => item.id === id)
          return message && isSelectableOwnMessage(message, replyAsSupport)
        }),
      )
      if (idSet.size === 0) return prev

      deletedCount = idSet.size
      pendingUndoIdsRef.current = [...idSet]

      return prev.map((message) => {
        if (!idSet.has(message.id)) return message
        return {
          ...message,
          deleted: true,
          deletedSnapshot: createDeletedSnapshot(message),
          body: '',
          attachments: undefined,
        }
      })
    })

    if (deletedCount === 0) return

    if (editingId && rawIds.includes(editingId)) {
      setEditingId(null)
      setEditDraft('')
    }
    setMenuOpenId(null)
    exitSelectionMode()

    setDeleteToast({
      message:
        deletedCount === 1
          ? 'Mensagem excluída com sucesso.'
          : 'Mensagens excluídas com sucesso.',
    })

    clearDeleteUndoTimer()
    deleteUndoTimeoutRef.current = window.setTimeout(() => {
      handleDeleteToastClose()
    }, DELETE_UNDO_MS)
  }

  function handleDeleteSelected() {
    if (selectedIds.length === 0) return
    softDeleteMessages(selectedIds)
  }

  function handleDeleteMessage(messageId: string) {
    softDeleteMessages([messageId])
  }

  function performOutboundSend(pendingId: string, text: string, files: File[]) {
    if (!supportApi) return

    void (async () => {
      try {
        const updated = await supportApi.onSendReply(text, files)
        setMessages((current) => {
          const optimistic = current.find((message) => message.id === pendingId)
          if (optimistic) revokeMessageAttachments(optimistic)
          const withoutSent = current.filter((message) => message.id !== pendingId)
          return mergeServerMessagesWithOptimistic(withoutSent, updated.messages)
        })
        setTicketStatus(updated.status)
        onTicketUpdate?.(updated)
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? { ...message, deliveryStatus: 'failed' as const }
              : message,
          ),
        )
        supportApi.onError?.(
          error instanceof Error ? error.message : 'Não foi possível enviar a resposta.',
        )
      }
    })()
  }

  function handleRetrySend(message: SupportMessage) {
    if (!supportApi || message.deliveryStatus !== 'failed') return

    void (async () => {
      const files = await attachmentsToFiles(message.attachments)
      if ((message.attachments?.length ?? 0) > 0 && files.length !== (message.attachments?.length ?? 0)) {
        supportApi.onError?.('Não foi possível recuperar os anexos. Envie novamente.')
        return
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                deliveryStatus: 'pending' as const,
                sentAt: formatMessageTime(new Date()),
              }
            : item,
        ),
      )

      performOutboundSend(message.id, message.body, files)
    })()
  }

  function handleSend() {
    const text = reply.trim()
    if ((!text && pendingFiles.length === 0) || isTyping) return
    if (!canReply) return

    if (supportApi) {
      const pendingId = createPendingMessageId()
      const snapshotFiles = pendingFiles.map((pending) => pending.file)
      const attachments = buildAttachmentsFromPending()
      const optimisticMessage: SupportMessage = {
        id: pendingId,
        author: replyAsSupport ? 'support' : 'operator',
        authorName: replyAsSupport ? getSupportAgentName() : getLoggedOperatorName(),
        body: text,
        sentAt: formatMessageTime(new Date()),
        attachments: attachments.length > 0 ? attachments : undefined,
        deliveryStatus: 'pending',
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setReply('')
      setPendingFiles([])
      setAttachmentError(null)
      performOutboundSend(pendingId, text, snapshotFiles)
      return
    }

    const attachments = buildAttachmentsFromPending()

    if (replyAsSupport) {
      const supportMessage: SupportMessage = {
        id: createMessageId(),
        author: 'support',
        authorName: getSupportAgentName(),
        body: text,
        sentAt: formatMessageTime(new Date()),
        attachments: attachments.length > 0 ? attachments : undefined,
      }
      setMessages((prev) => [...prev, supportMessage])
      setReply('')
      setPendingFiles([])
      setAttachmentError(null)
      return
    }

    const operatorMessage: SupportMessage = {
      id: createMessageId(),
      author: 'operator',
      authorName: getLoggedOperatorName(),
      body: text,
      sentAt: formatMessageTime(new Date()),
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    setMessages((prev) => [...prev, operatorMessage])
    setReply('')
    setPendingFiles([])
    setAttachmentError(null)

    if (!shouldSendGenericSupportAck(messages, true)) {
      return
    }

    setIsSending(true)
    setIsTyping(true)

    typingTimeoutRef.current = window.setTimeout(() => {
      const supportMessage: SupportMessage = {
        id: createMessageId(),
        author: 'support',
        authorName: 'Suporte Telefarmed',
        body: GENERIC_SUPPORT_REPLY,
        sentAt: formatMessageTime(new Date()),
      }
      setMessages((prev) => [...prev, supportMessage])
      setIsTyping(false)
      setIsSending(false)
      typingTimeoutRef.current = null
    }, TYPING_DELAY_MS)
  }

  function handleConfirmCloseTicket() {
    if (!ticket || ticketStatus === 'encerrado') return

    if (supportApi) {
      void (async () => {
        try {
          const updated = await supportApi.onCloseTicket()
          setMessages([...updated.messages])
          setTicketStatus(updated.status)
          setCloseConfirmOpen(false)
          setReply('')
          setPendingFiles((prev) => {
            revokePendingPreviews(prev)
            return []
          })
          setIsSending(false)
          setIsTyping(false)
          onTicketUpdate?.(updated)
        } catch (error) {
          supportApi.onError?.(
            error instanceof Error ? error.message : 'Não foi possível encerrar o chamado.',
          )
        }
      })()
      return
    }

    const closedAt = formatMessageTime(new Date())
    const closeMessage: SupportMessage = {
      id: createMessageId(),
      author: 'support',
      authorName: getSupportAgentName(),
      body: 'Chamado encerrado pela equipe Telefarmed. Se precisar de novo suporte, abra um novo chamado na sua unidade.',
      sentAt: closedAt,
    }
    const nextMessages = [...messages, closeMessage]

    setMessages(nextMessages)
    setTicketStatus('encerrado')
    setCloseConfirmOpen(false)
    setReply('')
    setPendingFiles((prev) => {
      revokePendingPreviews(prev)
      return []
    })
    setIsSending(false)
    setIsTyping(false)

    onTicketUpdate?.({
      ...ticket,
      status: 'encerrado',
      lastUpdate: closedAt,
      messages: nextMessages,
    })
  }

  if (!isActive || !ticket) return null

  const ticketOpen = ticketStatus !== 'encerrado'
  const canManageMessages = canManageMessagesProp ?? !readOnly
  const canReply = (canReplyProp ?? !readOnly) && ticketOpen
  const canCloseTicket = (canCloseTicketProp ?? replyAsSupport) && ticketOpen
  const messagesReadOnly = readOnly || !canManageMessages
  const showViewOnlyComposerNotice = ticketOpen && !canReply && !readOnly

  function handleCloseAttempt(event?: React.SyntheticEvent) {
    if (tourLockClose) {
      event?.preventDefault()
      event?.stopPropagation()
      return
    }
    onClose()
  }

  return createPortal(
    <>
      <style>{`
        @keyframes support-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes support-message-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .support-message-in {
          animation: support-message-in 0.3s ease-out;
        }
        @keyframes support-message-blink {
          0%, 100% { opacity: 1; }
          16.6% { opacity: 0.3; }
          33.3% { opacity: 1; }
          50% { opacity: 0.3; }
          66.6% { opacity: 1; }
          83.3% { opacity: 0.3; }
        }
        .support-message-blink {
          animation: support-message-blink 2s ease-in-out;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          aria-label="Fechar detalhes do chamado"
          onClick={handleCloseAttempt}
          tabIndex={panelVisible ? 0 : -1}
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        <aside
          data-tour="suporte-ticket-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-ticket-drawer-title"
          onTransitionEnd={(event) => {
            if (event.propertyName === 'transform') onTransitionEnd()
          }}
          className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
            panelVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <header
            data-tour="suporte-ticket-drawer-header"
            className="shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{ticket.number}</p>
                <h2
                  id="support-ticket-drawer-title"
                  className="mt-0.5 text-lg font-bold text-gray-900"
                >
                  {ticket.subject}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SituationStatusBadge
                    config={supportTicketStatusBadgeConfig[ticketStatus]}
                  />
                  {ticket.source ? (
                    <SituationStatusBadge
                      config={supportSourceBadgeConfig[ticket.source]}
                      widthClass={SUPPORT_SOURCE_BADGE_WIDTH}
                    />
                  ) : null}
                  <span className="text-xs text-gray-500">{ticket.category}</span>
                </div>
                {(readOnly || replyAsSupport) &&
                (ticket.source || ticket.municipalityName || ticket.ubtName) ? (
                  <div className="mt-3 space-y-1 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-600">
                    {ticket.source ? (
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-800">Origem:</span>
                        <SituationStatusBadge
                          config={supportSourceBadgeConfig[ticket.source]}
                          widthClass={SUPPORT_SOURCE_BADGE_WIDTH}
                        />
                      </p>
                    ) : null}
                    {ticket.municipalityName ? (
                      <p>
                        <span className="font-semibold text-gray-800">Prefeitura:</span>{' '}
                        {ticket.municipalityName}
                      </p>
                    ) : null}
                    {ticket.ubtName ? (
                      <p>
                        <span className="font-semibold text-gray-800">UBT:</span> {ticket.ubtName}
                      </p>
                    ) : null}
                    {ticket.openedByName ? (
                      <p>
                        <span className="font-semibold text-gray-800">Aberto por:</span>{' '}
                        {ticket.openedByName}
                        {ticket.openedByRole ? ` · ${ticket.openedByRole}` : ''}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {!readOnly && !replyAsSupport ? (
                  <button
                    type="button"
                    onClick={() => setFavoritesPanelOpen((current) => !current)}
                    className={[
                      'mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
                      favoritesPanelOpen
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/60 hover:text-amber-800',
                    ].join(' ')}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${favoriteIds.length > 0 ? 'fill-amber-400 text-amber-500' : ''}`}
                      strokeWidth={2}
                    />
                    Favoritas
                    {favoriteIds.length > 0 ? (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        {favoriteIds.length}
                      </span>
                    ) : null}
                  </button>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canCloseTicket ? (
                  <button
                    type="button"
                    onClick={() => setCloseConfirmOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                    Encerrar chamado
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {!readOnly && !replyAsSupport && favoritesPanelOpen ? (
            <SupportFavoritesPanel
              favorites={favoriteMessages}
              onSelect={handleNavigateToFavorite}
              onClose={() => setFavoritesPanelOpen(false)}
            />
          ) : null}

          {readOnly ? (
            <p className="shrink-0 border-b border-sky-100 bg-sky-50/80 px-5 py-2.5 text-center text-xs font-medium text-sky-800 sm:px-6">
              Visualização somente leitura — conversa entre o suporte Telefarmed e a unidade.
            </p>
          ) : null}
          {showViewOnlyComposerNotice ? (
            <p className="shrink-0 border-b border-amber-100 bg-amber-50/90 px-5 py-2.5 text-center text-xs font-medium text-amber-900 sm:px-6">
              Você pode visualizar esta conversa, mas não tem permissão para enviar mensagens ou encerrar o
              chamado.
            </p>
          ) : null}

          <div
            data-tour="suporte-ticket-drawer-chat"
            className="relative min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6"
          >
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
                <p className="text-sm font-medium text-gray-500">Carregando conversa…</p>
              </div>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.author === 'support' ? 'justify-start' : 'justify-end'}`}
              >
                <SupportMessageBubble
                  readOnly={messagesReadOnly}
                  replyAsSupport={replyAsSupport}
                  message={message}
                  selectionMode={
                    selectionMode && isSelectableOwnMessage(message, replyAsSupport)
                  }
                  isSelected={selectedIds.includes(message.id)}
                  onToggleSelect={handleToggleSelect}
                  onEnterSelectionMode={enterSelectionMode}
                  isFavorited={favoriteIds.includes(message.id)}
                  onToggleFavorite={() => handleToggleFavorite(message.id)}
                  isHighlighted={highlightedMessageId === message.id}
                  cardRef={
                    canManageMessages &&
                    !replyAsSupport &&
                    isSupportPartnerMessage(message)
                      ? (element) => {
                          if (element) messageRefs.current.set(message.id, element)
                          else messageRefs.current.delete(message.id)
                        }
                      : undefined
                  }
                  menuOpenId={menuOpenId}
                  editingId={editingId}
                  editDraft={editDraft}
                  onToggleMenu={handleToggleMenu}
                  onCloseMenu={handleCloseMenu}
                  onEditDraftChange={setEditDraft}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteMessage}
                  onRetrySend={supportApi ? handleRetrySend : undefined}
                />
              </div>
            ))}
            {canReply && isTyping ? (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {canManageMessages && selectionMode ? (
            <footer className="shrink-0 border-t border-gray-200 bg-gray-50/80 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  {selectedCount === 0
                    ? 'Nenhuma mensagem selecionada'
                    : selectedCount === 1
                      ? '1 mensagem selecionada'
                      : `${selectedCount} mensagens selecionadas`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    {allOwnSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                  <button
                    type="button"
                    onClick={exitSelectionMode}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={selectedCount === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir selecionadas
                  </button>
                </div>
              </div>
            </footer>
          ) : readOnly ? (
            <footer className="shrink-0 border-t border-gray-200 bg-gray-50/60 px-5 py-4 text-center text-xs text-gray-600 sm:px-6">
              Acompanhamento municipal — não é possível enviar mensagens nesta conversa.
            </footer>
          ) : showViewOnlyComposerNotice ? (
            <footer className="shrink-0 border-t border-gray-200 bg-gray-50/60 px-5 py-4 text-center text-xs text-gray-600 sm:px-6">
              Sem permissão de escrita neste chamado. Solicite acesso de inserção ou edição em Suporte ao
              administrador.
            </footer>
          ) : canReply ? (
            <footer className="shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                <MessageSquare className="h-3.5 w-3.5" />
                {replyAsSupport
                  ? `Responder como ${getSupportAgentName()}`
                  : `Responder como ${getLoggedOperatorName()}`}
              </label>

              {pendingFiles.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingFiles.map((pending) => (
                    <div
                      key={pending.id}
                      className="flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5"
                    >
                      {pending.type === 'image' && pending.previewUrl ? (
                        <img
                          src={pending.previewUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                      )}
                      <span className="max-w-[140px] truncate text-xs text-gray-700">
                        {pending.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(pending.id)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                        aria-label={`Remover ${pending.file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {attachmentError ? (
                <p className="mb-2 text-xs font-medium text-red-600">{attachmentError}</p>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept={CHAT_ATTACHMENT_ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files?.length) addFiles(event.target.files)
                  event.target.value = ''
                }}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Anexar PDF ou imagem"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={1}
                  placeholder="Digite sua mensagem..."
                  className="h-11 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm leading-5 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Enviar resposta"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">
                PDF ou imagem (PNG, JPG, WEBP) — máx. 10MB
              </p>
            </footer>
          ) : ticketStatus === 'encerrado' ? (
            <footer className="shrink-0 border-t border-gray-200 px-5 py-4 text-center text-xs text-gray-500 sm:px-6">
              Este chamado foi encerrado e não aceita novas respostas.
            </footer>
          ) : null}

          {canManageMessages ? (
            <Toast
              anchored
              message={deleteToast?.message ?? ''}
              visible={deleteToast !== null}
              variant="success"
              durationMs={DELETE_UNDO_MS}
              actionLabel="Desfazer"
              onAction={handleUndoDelete}
              onClose={handleDeleteToastClose}
            />
          ) : null}
          </div>
        </aside>
      </div>

      {replyAsSupport ? (
        <SupportTicketCloseConfirmModal
          open={closeConfirmOpen}
          ticketNumber={ticket.number}
          onCancel={() => setCloseConfirmOpen(false)}
          onConfirm={handleConfirmCloseTicket}
        />
      ) : null}
    </>,
    document.body,
  )
}

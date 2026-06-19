import { ArrowRight, ChevronDown, Clock3, FilePlus2, Sparkles } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  getDemoDocumentSectionsForProfession,
  type DemoClinicalDocumentKind,
  type DemoConsultationProfession,
  type DemoDocumentOption,
  type DemoDocumentSection,
} from '../../../../data/demoConsultationProfessions'
import { FLOATING_POPOVER_Z_INDEX } from '../../../../config/overlayLayers'
import { FloatingOverlayPortal } from '../../../ui/FloatingOverlayPortal'

const PANEL_MAX_WIDTH = 1040
const PANEL_VIEWPORT_MARGIN = 12

type MenuPosition = {
  top: number
  left: number
  width: number
}

type DemoIssueDocumentMegamenuProps = {
  profession: DemoConsultationProfession
  onSelect: (kind: DemoClinicalDocumentKind) => void
}

function countDocuments(sections: DemoDocumentSection[]) {
  let available = 0
  let total = 0
  for (const section of sections) {
    for (const item of section.items) {
      total += 1
      if (item.available) available += 1
    }
  }
  return { available, total, comingSoon: total - available }
}

function DocumentTile({
  item,
  onSelect,
}: {
  item: DemoDocumentOption
  onSelect: (kind: DemoClinicalDocumentKind) => void
}) {
  const Icon = item.icon
  const { accent } = item

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(item.id)}
      disabled={!item.available}
      className={[
        'group relative flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/35',
        item.available
          ? [
              accent.hoverBorder,
              accent.hoverBg,
              accent.hoverShadow,
              'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
            ].join(' ')
          : 'cursor-default border-dashed bg-slate-50/80 opacity-80',
      ].join(' ')}
      title={`${item.title} — ${item.description}`}
    >
      {!item.available ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
          <Clock3 className="h-2.5 w-2.5" strokeWidth={2.5} />
          Em breve
        </span>
      ) : null}

      <span
        className={[
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-4 transition duration-200',
          accent.iconBg,
          accent.iconRing,
          item.available ? 'group-hover:scale-105 group-hover:shadow-md' : 'grayscale',
        ].join(' ')}
      >
        <Icon className="h-4 w-4" strokeWidth={2.2} />
        {item.available ? (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <span className="block truncate pr-7 text-sm font-semibold text-slate-900" title={item.title}>
          {item.title}
        </span>
        <span
          className="mt-0.5 block truncate text-[11px] leading-snug text-slate-500"
          title={item.description}
        >
          {item.description}
        </span>
      </div>

      {item.available ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-[#FF6B00]/10 group-hover:text-[#FF6B00] group-hover:opacity-100">
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      ) : null}
    </button>
  )
}

function DocumentSection({
  section,
  onSelect,
}: {
  section: DemoDocumentSection
  onSelect: (kind: DemoClinicalDocumentKind) => void
}) {
  const availableCount = section.items.filter((item) => item.available).length

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span
          className={['h-9 w-1 shrink-0 rounded-full bg-gradient-to-b', section.accent.sectionBar].join(
            ' ',
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{section.title}</p>
          <p className="truncate text-xs text-slate-500">{section.subtitle}</p>
        </div>
        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1',
            section.accent.sectionBadge,
          ].join(' ')}
        >
          {availableCount}/{section.items.length} ativos
        </span>
      </div>

      <div
        className={[
          'grid gap-2.5 p-3',
          section.items.length < 3 ? 'grid-cols-2' : 'grid-cols-3',
        ].join(' ')}
      >
        {section.items.map((item) => (
          <DocumentTile key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

export function DemoIssueDocumentMegamenu({ profession, onSelect }: DemoIssueDocumentMegamenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const sections = useMemo(
    () => getDemoDocumentSectionsForProfession(profession) as DemoDocumentSection[],
    [profession],
  )
  const documentCounts = useMemo(() => countDocuments(sections), [sections])

  function computeMenuPosition(): MenuPosition | null {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - PANEL_VIEWPORT_MARGIN * 2)
    const left = Math.min(
      Math.max(PANEL_VIEWPORT_MARGIN, rect.right - width),
      window.innerWidth - width - PANEL_VIEWPORT_MARGIN,
    )
    return { top: rect.bottom + 10, left, width }
  }

  function updateMenuPosition() {
    const next = computeMenuPosition()
    if (next) setMenuPosition(next)
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }
    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [profession])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSelect(kind: DemoClinicalDocumentKind) {
    setOpen(false)
    onSelect(kind)
  }

  const megamenu =
    open && menuPosition ? (
      <FloatingOverlayPortal>
        <button
          type="button"
          aria-label="Fechar menu de documentos"
          className="fixed inset-0 cursor-default bg-slate-950/30 backdrop-blur-[2px]"
          style={{ zIndex: FLOATING_POPOVER_Z_INDEX - 2 }}
          onClick={() => setOpen(false)}
        />
        <div
          ref={menuRef}
          role="menu"
          aria-label="Emitir documento clínico"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            zIndex: FLOATING_POPOVER_Z_INDEX,
            pointerEvents: 'auto',
          }}
          className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.28)] ring-1 ring-black/5"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#FF6B00]/25 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8C33] text-white shadow-lg shadow-orange-500/30">
                  <FilePlus2 className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-base font-bold text-white">
                    Emitir documento
                    <Sparkles className="h-4 w-4 text-orange-300" strokeWidth={2} />
                  </p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    Documentos disponíveis para a profissão selecionada na demo
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                  {documentCounts.total} tipos
                </span>
                <span className="text-[11px] text-slate-400">
                  {documentCounts.available} disponíveis · {documentCounts.comingSoon} em breve
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-[min(72vh,580px)] overflow-y-auto overscroll-y-contain bg-gradient-to-b from-slate-50 to-slate-100/80 p-4">
            <div className="space-y-3">
              {sections.map((section) => (
                <DocumentSection key={section.id} section={section} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>
      </FloatingOverlayPortal>
    ) : null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }
          const position = computeMenuPosition()
          if (position) setMenuPosition(position)
          setOpen(true)
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white sm:text-sm',
          'bg-gradient-to-r from-[#FF6B00] via-[#FF7A1A] to-[#FF8C33]',
          'shadow-[0_6px_18px_rgba(255,107,0,0.35)] transition hover:brightness-105 active:scale-[0.98]',
          open ? 'ring-2 ring-[#FF6B00]/40 ring-offset-2 ring-offset-white' : '',
        ].join(' ')}
      >
        <FilePlus2 className="h-4 w-4" strokeWidth={2} />
        Emitir
        <ChevronDown
          className={['h-4 w-4 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
          strokeWidth={2}
        />
      </button>
      {megamenu}
    </div>
  )
}

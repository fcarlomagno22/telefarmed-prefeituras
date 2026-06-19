import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { searchIcdReference, type IcdSearchResult } from '../../../lib/api/reference/icd'

export type CidSelection = {
  code: string
  title: string
}

type CidSearchFieldProps = {
  value: CidSelection | null
  onChange: (value: CidSelection | null) => void
  disabled?: boolean
}

function sanitizeIcdTitle(title: string): string {
  return title
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeIcdResult(item: IcdSearchResult): IcdSearchResult {
  return {
    ...item,
    title: sanitizeIcdTitle(item.title),
  }
}

export function CidSearchField({ value, onChange, disabled = false }: CidSearchFieldProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(value ? `${value.code} — ${value.title}` : '')
  const [results, setResults] = useState<IcdSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setQuery('')
      return
    }
    setQuery(`${value.code} — ${value.title}`)
  }, [value])

  useEffect(() => {
    if (disabled) return

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      setHint(null)
      return
    }

    if (value && query === `${value.code} — ${value.title}`) {
      return
    }

    setLoading(true)
    setHint(null)

    const timer = window.setTimeout(() => {
      void searchIcdReference(trimmed)
        .then((response) => {
          setConfigured(response.configured)
          setResults(response.results.map(normalizeIcdResult))
          if (response.error) {
            setHint(response.error)
          } else if (!response.configured) {
            setHint('Busca OMS indisponível. Informe o CID manualmente.')
          } else if (response.results.length === 0) {
            setHint('Nenhum CID encontrado. Você pode digitar o código manualmente.')
          }
        })
        .catch(() => {
          setResults([])
          setHint('Não foi possível consultar a API da OMS.')
        })
        .finally(() => setLoading(false))
    }, 400)

    return () => window.clearTimeout(timer)
  }, [disabled, query, value])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function handleSelect(item: IcdSearchResult) {
    const normalized = normalizeIcdResult(item)
    onChange({ code: normalized.code, title: normalized.title })
    setQuery(`${normalized.code} — ${normalized.title}`)
    setOpen(false)
    setResults([])
    setHint(null)
  }

  function handleClear() {
    onChange(null)
    setQuery('')
    setResults([])
    setHint(null)
    setOpen(false)
  }

  function handleInputChange(nextValue: string) {
    setQuery(nextValue)
    if (value && nextValue !== `${value.code} — ${value.title}`) {
      onChange(null)
    }
    setOpen(true)
  }

  function handleManualCommit() {
    const trimmed = query.trim()
    if (!trimmed || value) return

    const codeMatch = trimmed.match(/^([A-Za-z]\d{2}(?:\.\d{1,2})?)/)
    if (!codeMatch) return

    onChange({
      code: codeMatch[1]!.toUpperCase(),
      title: trimmed.slice(codeMatch[0].length).replace(/^[—\-\s]+/, '').trim(),
    })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-800">CID (opcional)</span>
        <span className="text-[11px] font-medium text-gray-400">OMS · ICD-11 / CID-10</span>
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              if (results[0]) {
                handleSelect(results[0])
                return
              }
              handleManualCommit()
            }
            if (event.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder="Buscar por código ou descrição (ex.: J06.9, gripe)…"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 disabled:opacity-60"
        />

        {value || query ? (
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Limpar CID"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Consultando API da OMS…
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : (
        <p className="mt-1.5 text-xs text-gray-400">
          {configured
            ? 'Busca integrada à API ICD da Organização Mundial da Saúde.'
            : 'Digite o código CID manualmente (ex.: J06.9).'}
        </p>
      )}

      {open && results.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.map((item) => (
            <li key={`${item.code}-${item.uri ?? item.title}`} role="option">
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-sky-50"
              >
                <span className="text-sm font-semibold text-gray-900">{item.code}</span>
                <span className="text-xs leading-snug text-gray-600">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

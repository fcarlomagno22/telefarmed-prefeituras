import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

type CredentialPortalAccessLinkProps = {
  loginUrl: string | null | undefined
  className?: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copied
    } catch {
      return false
    }
  }
}

export function CredentialPortalAccessLink({
  loginUrl,
  className = '',
}: CredentialPortalAccessLinkProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  if (!loginUrl?.trim()) return null

  async function handleCopy() {
    const success = await copyToClipboard(loginUrl!)
    if (success) {
      setCopyError(false)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      return
    }
    setCopyError(true)
  }

  return (
    <div
      className={[
        'rounded-xl border border-sky-200/80 bg-sky-50/60 px-4 py-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-xs font-semibold text-gray-700">
        Acesso:{' '}
        <span className="font-mono text-sm font-medium text-gray-900">{loginUrl}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              Link copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copiar link
            </>
          )}
        </button>
        {copyError ? (
          <span className="text-xs text-red-600">Não foi possível copiar. Selecione o link acima.</span>
        ) : null}
      </div>
    </div>
  )
}

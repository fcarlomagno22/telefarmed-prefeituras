import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, type ClipboardEvent } from 'react'

const PIN_LENGTH = 6

type PinInputProps = {
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisible: () => void
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  id?: string
}

export function PinInput({
  value,
  onChange,
  visible,
  onToggleVisible,
  error = false,
  disabled = false,
  autoFocus = false,
  id = 'lgpd-pin',
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.padEnd(PIN_LENGTH, ' ').slice(0, PIN_LENGTH).split('')

  useEffect(() => {
    if (!autoFocus || disabled) return
    const timer = window.setTimeout(() => inputRefs.current[0]?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [autoFocus, disabled])

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(PIN_LENGTH - 1, index))
    inputRefs.current[clamped]?.focus()
    inputRefs.current[clamped]?.select()
  }

  function updateDigit(index: number, digit: string) {
    const next = value.split('')
    while (next.length < PIN_LENGTH) next.push('')
    next[index] = digit
    onChange(next.join('').replace(/\s/g, '').slice(0, PIN_LENGTH))
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      updateDigit(index, '')
      return
    }

    if (cleaned.length > 1) {
      const merged = (value + cleaned).replace(/\D/g, '').slice(0, PIN_LENGTH)
      onChange(merged)
      focusIndex(Math.min(merged.length, PIN_LENGTH - 1))
      return
    }

    updateDigit(index, cleaned[0]!)
    if (index < PIN_LENGTH - 1) focusIndex(index + 1)
  }

  function handleKeyDown(index: number, key: string) {
    if (key === 'Backspace') {
      if (digits[index]?.trim()) {
        updateDigit(index, '')
        return
      }
      if (index > 0) {
        updateDigit(index - 1, '')
        focusIndex(index - 1)
      }
    }

    if (key === 'ArrowLeft' && index > 0) focusIndex(index - 1)
    if (key === 'ArrowRight' && index < PIN_LENGTH - 1) focusIndex(index + 1)
  }

  function handlePaste(event: ClipboardEvent) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (!pasted) return
    onChange(pasted)
    focusIndex(Math.min(pasted.length, PIN_LENGTH - 1))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${id}-0`} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Senha da unidade
        </label>
        <button
          type="button"
          onClick={onToggleVisible}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {visible ? 'Ocultar senha' : 'Ver senha'}
        </button>
      </div>

      <div
        className={`flex justify-center gap-2 sm:gap-2.5 ${error ? 'animate-[pin-shake_0.45s_ease-in-out]' : ''}`}
        onPaste={handlePaste}
      >
        {digits.map((digit, index) => {
          const filled = Boolean(digit.trim())
          const isActive = value.length === index || (value.length === PIN_LENGTH && index === PIN_LENGTH - 1)

          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              id={index === 0 ? `${id}-0` : undefined}
              type={visible ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              disabled={disabled}
              maxLength={1}
              value={digit.trim()}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event.key)}
              onFocus={(event) => event.target.select()}
              className={`h-12 w-11 rounded-xl border-2 bg-white text-center text-lg font-bold text-gray-900 outline-none transition sm:h-14 sm:w-12 ${
                error
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-200'
                  : filled
                    ? 'border-[var(--brand-primary)]/50 shadow-[0_0_0_3px_rgba(255,107,0,0.12)]'
                    : isActive
                      ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20'
                      : 'border-gray-200 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'
              }`}
              aria-label={`Dígito ${index + 1} da senha`}
            />
          )
        })}
      </div>
    </div>
  )
}

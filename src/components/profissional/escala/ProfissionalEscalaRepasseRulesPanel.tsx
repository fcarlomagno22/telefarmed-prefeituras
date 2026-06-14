import { ShieldCheck } from 'lucide-react'
import type { EscalaRepasseRule } from '../../../types/adminEscala'
import { buildProfissionalRepasseRuleBlocks } from '../../../utils/profissional/formatProfissionalRepasseRules'

type ProfissionalEscalaRepasseRulesPanelProps = {
  repasseRule: EscalaRepasseRule
  compact?: boolean
  horizontal?: boolean
}

export function ProfissionalEscalaRepasseRulesPanel({
  repasseRule,
  compact = false,
  horizontal = false,
}: ProfissionalEscalaRepasseRulesPanelProps) {
  const blocks = buildProfissionalRepasseRuleBlocks(repasseRule)

  return (
    <div
      className={[
        'rounded-2xl border border-orange-100/90 bg-gradient-to-br from-orange-50/50 to-white',
        compact ? 'p-3' : 'p-5',
      ].join(' ')}
    >
      <div className="mb-4 flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
        <div>
          <p className="text-sm font-bold text-gray-900">Regras de repasse e presença</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            Definidas na publicação deste plantão. O pagamento integral exige cumprir todos os
            critérios abaixo.
          </p>
        </div>
      </div>

      <div
        className={
          horizontal
            ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            : 'space-y-3'
        }
      >
        {blocks.map((block) => (
          <div
            key={block.title}
            className={[
              'rounded-xl border border-orange-100/80 bg-white/90 px-3 py-3 shadow-sm',
              horizontal && block.title.includes('Se não') ? 'sm:col-span-2 xl:col-span-1' : '',
            ].join(' ')}
          >
            <p className="text-xs font-bold text-gray-900">{block.title}</p>
            <ul className="mt-1.5 space-y-1">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-gray-700">
                  <span className="font-bold text-[var(--brand-primary)]">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

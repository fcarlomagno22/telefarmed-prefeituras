import type { DemoConsultationProfession } from '../../../../data/demoConsultationProfessions'
import { DEMO_CONSULTATION_PROFESSIONS } from '../../../../data/demoConsultationProfessions'

type DemoProfessionSelectorProps = {
  value: DemoConsultationProfession
  onChange: (profession: DemoConsultationProfession) => void
}

export function DemoProfessionSelector({ value, onChange }: DemoProfessionSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200/80 bg-violet-50/70 px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
        Profissão (demo)
      </span>
      <div className="flex flex-wrap gap-1.5">
        {DEMO_CONSULTATION_PROFESSIONS.map((profession) => {
          const active = profession.id === value
          return (
            <button
              key={profession.id}
              type="button"
              onClick={() => onChange(profession.id)}
              className={[
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                active
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-300/50'
                  : 'border border-violet-200 bg-white text-violet-800 hover:border-violet-300 hover:bg-violet-50',
              ].join(' ')}
            >
              {profession.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

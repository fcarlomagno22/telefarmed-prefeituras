import { Check } from 'lucide-react'
import {
  portalPasswordRequirements,
  type PasswordRequirement,
} from '../../../utils/passwordPolicy'

type PasswordStrengthChecklistProps = {
  password: string
  requirements?: PasswordRequirement[]
}

export function PasswordStrengthChecklist({
  password,
  requirements = portalPasswordRequirements,
}: PasswordStrengthChecklistProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
      {requirements.map((requirement) => {
        const met = requirement.test(password)

        return (
          <li
            key={requirement.id}
            className={`flex items-center gap-2 text-[11px] ${met ? 'text-emerald-700' : 'text-gray-400'}`}
          >
            <Check
              className={`h-3 w-3 shrink-0 ${met ? 'opacity-100' : 'opacity-30'}`}
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{requirement.label}</span>
          </li>
        )
      })}
    </ul>
  )
}

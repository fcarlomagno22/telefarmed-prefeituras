import type { NetworkUserFullProfile } from '../../data/networkUserProfiles'
import type { NetworkUser } from '../../data/networkUsersMock'
import type { UserProfileEdits } from '../../data/networkUserLocalData'

export function buildEditableData(
  user: NetworkUser,
  profile: NetworkUserFullProfile,
  edits?: UserProfileEdits | null,
): UserProfileEdits {
  if (edits) return { ...edits, contacts: edits.contacts.map((c) => ({ ...c })) }

  return {
    phone: user.phone !== '—' ? user.phone : '',
    email: profile.email === '—' ? '' : profile.email,
    zipCode: profile.zipCode === '—' ? '' : profile.zipCode,
    street: profile.street === '—' ? '' : profile.street,
    number: profile.number === '—' ? '' : profile.number,
    complement: profile.complement,
    neighborhood: profile.neighborhood,
    city: profile.city,
    state: profile.state,
    guardianName: profile.guardianName,
    guardianCpf: profile.guardianCpf,
    contacts: profile.contacts.map((c) => ({ ...c })),
  }
}

export const drawerInputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-2.5 px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

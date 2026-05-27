import { Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  emptyPatientContact,
  type PatientContact,
  type PatientRegistration,
} from '../../data/unitDashboardMock'
import { CustomSelect } from '../ui/CustomSelect'
import { maskPhone } from '../../utils/masks'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'

type PatientContactsStepProps = {
  data: PatientRegistration
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
  embedded?: boolean
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const inputErrorClass =
  'w-full rounded-xl border border-red-300 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-200/60'

const relationshipOptions = [
  { value: '', label: 'Selecione' },
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'conjuge', label: 'Cônjuge / Companheiro(a)' },
  { value: 'filho', label: 'Filho(a)' },
  { value: 'irmao', label: 'Irmão(ã)' },
  { value: 'avo', label: 'Avô / Avó' },
  { value: 'tio', label: 'Tio(a)' },
  { value: 'amigo', label: 'Amigo(a)' },
  { value: 'outro', label: 'Outro' },
]

function isContactEmpty(contact: PatientContact) {
  return (
    !contact.name.trim() &&
    !contact.phone.replace(/\D/g, '') &&
    !contact.relationship
  )
}

function isContactComplete(contact: PatientContact) {
  return (
    contact.name.trim().length > 0 &&
    contact.phone.replace(/\D/g, '').length >= 10 &&
    contact.relationship.length > 0
  )
}

export function PatientContactsStep({
  data,
  onChange,
  onSubmit,
  onBack,
  embedded = false,
}: PatientContactsStepProps) {
  const [submitted, setSubmitted] = useState(false)

  const contacts =
    Array.isArray(data.contacts) && data.contacts.length > 0
      ? data.contacts
      : [emptyPatientContact()]

  function updateContacts(next: PatientContact[]) {
    onChange({ ...data, contacts: next })
  }

  function patchContact(id: string, field: keyof PatientContact, value: string) {
    updateContacts(
      contacts.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact,
      ),
    )
  }

  function addContact() {
    updateContacts([...contacts, emptyPatientContact()])
  }

  function removeContact(id: string) {
    if (contacts.length <= 1) {
      updateContacts([emptyPatientContact()])
      return
    }
    updateContacts(contacts.filter((contact) => contact.id !== id))
  }

  const filledContacts = contacts.filter((contact) => !isContactEmpty(contact))
  const hasAtLeastOneComplete = filledContacts.some(isContactComplete)
  const hasIncomplete = filledContacts.some((contact) => !isContactComplete(contact))
  const continueReady = hasAtLeastOneComplete && !hasIncomplete

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    if (!continueReady) return

    const filled = contacts.filter((contact) => !isContactEmpty(contact))
    const complete = filled.filter(isContactComplete)
    onChange({ ...data, contacts: complete })
    onSubmit()
  }

  function handleContinueBlocked() {
    setSubmitted(true)
  }

  return (
    <AttendanceStepShell
      embedded={embedded}
      title="Dados de contato"
      description="Cadastre pessoas para contato em caso de necessidade. Você pode adicionar quantos contatos quiser."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueType="submit"
          formId="patient-contacts-form"
          continueReady={continueReady}
          onContinueBlocked={handleContinueBlocked}
        />
      }
    >
      <form
        id="patient-contacts-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar"
      >
        <div className="space-y-4">
          {contacts.map((contact, index) => {
            const showErrors = submitted && !isContactEmpty(contact) && !isContactComplete(contact)
            const highlightContact =
              submitted &&
              ((!hasAtLeastOneComplete && (index === 0 || !isContactEmpty(contact))) ||
                showErrors)

            return (
              <AttendanceFieldHighlight
                key={contact.id}
                highlight={highlightContact}
                className="block"
              >
              <article
                className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm">
                      <UserRound className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      Contato {index + 1}
                    </span>
                  </div>
                  {contacts.length > 1 || !isContactEmpty(contact) ? (
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remover contato ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-gray-700">Nome</span>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => patchContact(contact.id, 'name', e.target.value)}
                      placeholder="Nome do contato"
                      className={showErrors && !contact.name.trim() ? inputErrorClass : inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-gray-700">Telefone</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={contact.phone}
                      onChange={(e) =>
                        patchContact(contact.id, 'phone', maskPhone(e.target.value))
                      }
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className={
                        showErrors && contact.phone.replace(/\D/g, '').length < 10
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-gray-700">
                      Parentesco
                    </span>
                    <CustomSelect
                      value={contact.relationship}
                      onChange={(value) => patchContact(contact.id, 'relationship', value)}
                      options={relationshipOptions}
                      placeholder="Selecione"
                    />
                  </label>
                </div>

                {showErrors ? (
                  <p className="mt-2 text-xs text-red-600">
                    Preencha nome, telefone e parentesco deste contato.
                  </p>
                ) : null}
              </article>
              </AttendanceFieldHighlight>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addContact}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary-light)]/40"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Adicionar contato
        </button>

        {submitted && !hasAtLeastOneComplete ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            Informe ao menos um contato completo para continuar.
          </p>
        ) : null}
      </form>
    </AttendanceStepShell>
  )
}

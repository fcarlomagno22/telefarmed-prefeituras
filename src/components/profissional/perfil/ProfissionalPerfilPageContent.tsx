import { useState } from 'react'
import {
  Building2,
  CalendarDays,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react'
import {
  formatProfissionalConselhoRegistro,
  getProfissionalConselhoConfig,
} from '../../../config/profissionalConselhoConfig'
import type { ProfissionalPerfil } from '../../../types/profissionalPerfil'
import { ProfissionalPerfilAssinaturaCard } from './ProfissionalPerfilAssinaturaCard'
import { ProfissionalPerfilDocumentosCard } from './ProfissionalPerfilDocumentosCard'
import { ProfissionalPerfilFotoCard } from './ProfissionalPerfilFotoCard'
import { ProfissionalPerfilCard, ProfissionalPerfilField, ProfissionalPerfilInfoBox } from './ProfissionalPerfilCard'
import {
  PROFISSIONAL_DESCRIPTION_MAX,
  profissionalPerfilBankOptions,
  profissionalPerfilInputClass,
  profissionalPerfilPixKeyTypeLabels,
  profissionalPerfilSpecialtyOptions,
  profissionalPerfilTopRowBodyClass,
  profissionalPerfilTopRowCardClass,
  profissionalPerfilTopRowHeaderClass,
} from './profissionalPerfilUi'

type ProfissionalPerfilPageContentProps = {
  profile: ProfissionalPerfil
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

function formatAttendances(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/** Grid 3 colunas quando a área de conteúdo tem largura suficiente (desconta sidebar). */
const perfilGridClass = [
  'grid w-full grid-cols-1 gap-x-5 gap-y-4',
  '@min-[920px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)_288px]',
  '@min-[920px]:grid-rows-[auto_auto]',
  '@min-[920px]:items-stretch',
  '@min-[920px]:gap-y-3',
].join(' ')

export function ProfissionalPerfilPageContent({ profile }: ProfissionalPerfilPageContentProps) {
  const conselho = getProfissionalConselhoConfig(profile.conselhoClasse)
  const conselhoRegistroDisplay = formatProfissionalConselhoRegistro(
    conselho.conselhoRegionalSigla,
    profile.conselhoRegistro,
    profile.conselhoUf,
  )

  const [fullName, setFullName] = useState(profile.fullName)
  const [registro, setRegistro] = useState(`${profile.conselhoRegistro}-${profile.conselhoUf}`)
  const [specialty, setSpecialty] = useState(profile.specialty)
  const [rqe, setRqe] = useState(profile.rqe)
  const [cpf, setCpf] = useState(profile.cpf)
  const [birthDate, setBirthDate] = useState(formatDate(profile.birthDate))
  const [description, setDescription] = useState(profile.professionalDescription)
  const [address, setAddress] = useState(profile.professionalAddress)

  const { empresa, bankAccount, publicSummary } = profile
  const [razaoSocial, setRazaoSocial] = useState(empresa.razaoSocial)
  const [cnpj, setCnpj] = useState(empresa.cnpj)
  const [bankCode, setBankCode] = useState(bankAccount.bankCode)
  const [agency, setAgency] = useState(bankAccount.agency)
  const [account, setAccount] = useState(bankAccount.account)
  const [pixKeyType, setPixKeyType] = useState(profile.pixKeyType)
  const [pixKey, setPixKey] = useState(empresa.pixKeys[profile.pixKeyType])
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)

  return (
    <div className={perfilGridClass}>
      {/* Col 1 — Informações */}
      <ProfissionalPerfilCard
        icon={UserRound}
        title="Informações profissionais"
        className={['@min-[920px]:col-start-1', profissionalPerfilTopRowCardClass].join(' ')}
        headerClassName={profissionalPerfilTopRowHeaderClass}
        bodyClassName={profissionalPerfilTopRowBodyClass}
      >
        <ProfissionalPerfilField label="Nome completo" className="xl:col-span-2">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={profissionalPerfilInputClass}
          />
        </ProfissionalPerfilField>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <ProfissionalPerfilField label={conselho.registroFieldLabel}>
            <input
              type="text"
              value={registro}
              onChange={(e) => setRegistro(e.target.value)}
              className={profissionalPerfilInputClass}
            />
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="Especialidade principal">
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className={profissionalPerfilInputClass}
            >
              {profissionalPerfilSpecialtyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="CPF">
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className={profissionalPerfilInputClass}
            />
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="Data de nascimento">
            <div className="relative">
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={profissionalPerfilInputClass}
              />
              <CalendarDays
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
            </div>
          </ProfissionalPerfilField>
          {profile.conselhoClasse === 'medico' ? (
            <ProfissionalPerfilField label="RQE">
              <input
                type="text"
                value={rqe}
                onChange={(e) => setRqe(e.target.value)}
                className={profissionalPerfilInputClass}
              />
            </ProfissionalPerfilField>
          ) : null}
        </div>

        <ProfissionalPerfilField label="Descrição profissional">
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, PROFISSIONAL_DESCRIPTION_MAX))}
              rows={2}
              className={`${profissionalPerfilInputClass} resize-none py-2 leading-relaxed`}
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums text-gray-400">
              {description.length}/{PROFISSIONAL_DESCRIPTION_MAX}
            </span>
          </div>
        </ProfissionalPerfilField>

        <ProfissionalPerfilField label="Endereço profissional">
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${profissionalPerfilInputClass} pl-9`}
            />
          </div>
        </ProfissionalPerfilField>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button type="button" className="btn-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold">
            Salvar alterações
          </button>
        </div>
      </ProfissionalPerfilCard>

      {/* Col 2 — Assinatura digital */}
      <ProfissionalPerfilAssinaturaCard
        profile={profile}
        className={['@min-[920px]:col-start-2 @min-[920px]:min-h-0', profissionalPerfilTopRowCardClass].join(
          ' ',
        )}
        headerClassName={profissionalPerfilTopRowHeaderClass}
        bodyClassName={profissionalPerfilTopRowBodyClass}
      />

      {/* Col 3 — Sidebar */}
      <div className="flex flex-col gap-4 @min-[920px]:col-start-3 @min-[920px]:row-span-2 @min-[920px]:row-start-1">
        <ProfissionalPerfilFotoCard avatarUrl={avatarUrl} onAvatarUrlChange={setAvatarUrl} />

        <ProfissionalPerfilDocumentosCard profile={profile} />

        <ProfissionalPerfilCard icon={Star} title="Resumo do perfil" className="shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-bold text-gray-900">{profile.fullName}</p>
                {publicSummary.isOnline ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Online
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-gray-500">
                {conselhoRegistroDisplay} · {profile.specialty}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5 text-center">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Atendimento online</p>
              <p className="mt-1 text-[11px] font-bold text-emerald-600">{publicSummary.onlineLabel}</p>
            </div>
            <div className="border-x border-gray-200 px-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Avaliação média</p>
              <p className="mt-1 text-[11px] font-bold text-gray-900">
                {publicSummary.averageRating.toFixed(1).replace('.', ',')}
              </p>
              <p className="text-[9px] text-gray-500">({publicSummary.reviewCount} avaliações)</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Atendimentos</p>
              <p className="mt-1 text-[11px] font-bold text-gray-900">
                {formatAttendances(publicSummary.totalAttendances)}
              </p>
              <p className="text-[9px] text-gray-500">Realizados</p>
            </div>
          </div>

          <ProfissionalPerfilInfoBox icon={ShieldCheck}>
            Seu perfil público é exibido para pacientes durante o agendamento e no histórico de consultas.
          </ProfissionalPerfilInfoBox>
        </ProfissionalPerfilCard>
      </div>

      {/* Linha 2 — Banco (col 1+2) */}
      <ProfissionalPerfilCard
        icon={Building2}
        title="Dados bancários / PIX"
        className="@min-[920px]:col-span-2 @min-[920px]:col-start-1 @min-[920px]:row-start-2"
        bodyClassName="gap-3.5"
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <ProfissionalPerfilField label="Razão social / Empresa">
            <input
              type="text"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className={profissionalPerfilInputClass}
            />
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="CNPJ">
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className={profissionalPerfilInputClass}
            />
          </ProfissionalPerfilField>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <ProfissionalPerfilField label="Banco" className="sm:col-span-2 lg:col-span-1">
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className={profissionalPerfilInputClass}
            >
              {profissionalPerfilBankOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="Agência">
            <input
              type="text"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className={profissionalPerfilInputClass}
            />
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="Conta">
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className={profissionalPerfilInputClass}
            />
          </ProfissionalPerfilField>
          <ProfissionalPerfilField label="Tipo de chave PIX">
            <select
              value={pixKeyType}
              onChange={(e) => {
                const next = e.target.value as typeof pixKeyType
                setPixKeyType(next)
                setPixKey(empresa.pixKeys[next])
              }}
              className={profissionalPerfilInputClass}
            >
              {Object.entries(profissionalPerfilPixKeyTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </ProfissionalPerfilField>
        </div>

        <ProfissionalPerfilField label="Chave PIX">
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className={profissionalPerfilInputClass}
          />
        </ProfissionalPerfilField>

        <ProfissionalPerfilInfoBox icon={Lock}>
          Seus dados bancários são criptografados e utilizados exclusivamente para repasses financeiros
          conforme os padrões de segurança da plataforma.
        </ProfissionalPerfilInfoBox>
      </ProfissionalPerfilCard>
    </div>
  )
}

import { useRef, useState } from 'react'
import { CloudUpload, ExternalLink, PenLine, ShieldCheck } from 'lucide-react'
import {
  formatProfissionalConselhoRegistro,
  getProfissionalConselhoConfig,
} from '../../../config/profissionalConselhoConfig'
import { useProfissionalPerfilCertificado } from '../../../hooks/useProfissionalPerfilCertificado'
import type { ProfissionalPerfil } from '../../../types/profissionalPerfil'
import { ProfissionalPerfilCard } from './ProfissionalPerfilCard'
import { ProfissionalPerfilVincularCertificadoModal } from './ProfissionalPerfilVincularCertificadoModal'
import { ProfissionalPerfilInfoTooltip } from './ProfissionalPerfilInfoTooltip'
import {
  ACCEPT_CERTIFICADO_A1,
  profissionalPerfilCertificadoStatusConfig,
  profissionalPerfilInputClass,
} from './profissionalPerfilUi'

type ProfissionalPerfilAssinaturaCardProps = {
  profile: ProfissionalPerfil
  className?: string
  headerClassName?: string
  bodyClassName?: string
}

function formatShortDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))
}

function isCertificadoFile(file: File) {
  const name = file.name.toLowerCase()
  return name.endsWith('.pfx') || name.endsWith('.p12')
}

export function ProfissionalPerfilAssinaturaCard({
  profile,
  className,
  headerClassName,
  bodyClassName,
}: ProfissionalPerfilAssinaturaCardProps) {
  const conselho = getProfissionalConselhoConfig(profile.conselhoClasse)
  const {
    certificado: cert,
    vincularOpen,
    openVincularModal,
    closeVincularModal,
    vincularCertificadoConselho,
  } = useProfissionalPerfilCertificado({ profile })
  const status = profissionalPerfilCertificadoStatusConfig[cert.status]

  const registroLabel = formatProfissionalConselhoRegistro(
    conselho.conselhoRegionalSigla,
    profile.conselhoRegistro,
    profile.conselhoUf,
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [certPassword, setCertPassword] = useState('')

  const isConselhoAtivo = cert.modo === 'conselho_nuvem' && cert.status === 'ativo'
  const isA1Ativo = cert.modo === 'a1_arquivo' && cert.status === 'ativo'

  return (
    <>
    <ProfissionalPerfilCard
      icon={PenLine}
      title="Assinatura digital"
      className={className}
      headerClassName={headerClassName}
      bodyClassName={bodyClassName}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-gray-500">{registroLabel}</p>
        <span
          className={[
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
            status.className,
          ].join(' ')}
        >
          {status.label}
        </span>
      </div>

      {/* Status atual */}
      <div
        className={[
          'rounded-lg border px-3 py-2',
          isConselhoAtivo || isA1Ativo
            ? 'border-emerald-100 bg-emerald-50/60'
            : 'border-gray-100 bg-gray-50/80',
        ].join(' ')}
      >
        {isConselhoAtivo ? (
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">{conselho.certificadoNuvemTitulo}</p>
              <p className="mt-0.5 text-[11px] text-gray-600">{cert.emissorDescricao}</p>
              {cert.expiresAt ? (
                <p className="mt-1 text-[10px] text-gray-500">
                  Validade: {formatShortDate(cert.expiresAt)}
                </p>
              ) : null}
            </div>
          </div>
        ) : isA1Ativo ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">Certificado A1 (ICP-Brasil)</p>
            <p className="mt-0.5 break-all font-mono text-[11px] text-gray-600">{cert.arquivoNome}</p>
            {cert.emissorDescricao ? (
              <p className="mt-1 text-[10px] text-gray-500">{cert.emissorDescricao}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            Vincule o certificado do seu conselho ou envie um arquivo A1 ICP-Brasil para assinar
            receitas, atestados e documentos clínicos.
          </p>
        )}
      </div>

      {/* Conselho */}
      <section className="space-y-1.5 rounded-lg border border-gray-100 bg-white p-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-xs font-bold text-gray-900">
            Certificado do conselho
            {conselho.certificadoNuvemDisponivel ? (
              <span className="ml-1.5 font-semibold text-[var(--brand-primary)]">(recomendado)</span>
            ) : null}
          </p>
          <ProfissionalPerfilInfoTooltip
            label="Informações sobre o certificado do conselho"
            widthClass="w-[15.5rem]"
            content={
              <>
                <p>{conselho.certificadoNuvemDescricao}</p>
                <p className="mt-2 text-white/90">{conselho.certificadoOrientacao}</p>
              </>
            }
          />
        </div>
        <div
          className={[
            'grid gap-2',
            conselho.certificadoNuvemDisponivel ? 'grid-cols-2' : 'grid-cols-1',
          ].join(' ')}
        >
          <a
            href={conselho.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/20 px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)]/35"
          >
            <span className="min-w-0">
              {conselho.certificadoNuvemDisponivel
                ? `Obter no ${conselho.conselhoFederal}`
                : `Portal do ${conselho.conselhoFederal}`}
            </span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </a>
          {conselho.certificadoNuvemDisponivel ? (
            <button
              type="button"
              onClick={openVincularModal}
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-gray-700 transition hover:bg-gray-50"
            >
              {isConselhoAtivo ? 'Revalidar vínculo' : 'Vincular certificado'}
            </button>
          ) : null}
        </div>
      </section>

      {/* A1 alternativo */}
      <section className="space-y-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/40 p-2.5">
        <p className="text-xs font-bold text-gray-900">Ou: certificado A1 (.pfx / .p12)</p>
        <p className="text-[11px] leading-relaxed text-gray-600">
          Arquivo ICP-Brasil emitido por Autoridade Certificadora credenciada, com registro ativo no{' '}
          {conselho.conselhoRegionalSigla}.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_CERTIFICADO_A1}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && isCertificadoFile(file)) setSelectedFileName(file.name)
            e.target.value = ''
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center transition hover:border-[var(--brand-primary)]/30"
        >
          <CloudUpload className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
          <span className="mt-1 text-[11px] text-gray-700">
            {selectedFileName ? (
              <span className="font-semibold text-gray-900">{selectedFileName}</span>
            ) : (
              'Selecionar .pfx ou .p12'
            )}
          </span>
        </button>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-gray-600">Senha do certificado</span>
          <input
            type="password"
            value={certPassword}
            onChange={(e) => setCertPassword(e.target.value)}
            autoComplete="off"
            placeholder="Senha definida na emissão"
            className={profissionalPerfilInputClass}
          />
        </label>

        <button
          type="button"
          disabled={!selectedFileName || !certPassword.trim()}
          className="w-full rounded-lg border border-[var(--brand-primary)]/40 bg-white py-1.5 text-[11px] font-semibold text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar certificado A1
        </button>
      </section>

      <p className="pt-1 text-[10px] text-gray-500">
        Última atualização:{' '}
        <span className="font-medium text-gray-700">{formatShortDate(cert.updatedAt)}</span>
      </p>
    </ProfissionalPerfilCard>

    <ProfissionalPerfilVincularCertificadoModal
      open={vincularOpen}
      profile={profile}
      onClose={closeVincularModal}
      onVincular={vincularCertificadoConselho}
    />
    </>
  )
}

import { Camera } from 'lucide-react'
import { useProfissionalPerfilAvatar } from '../../../hooks/useProfissionalPerfilAvatar'
import { ProfissionalPerfilAlterarFotoModal } from './ProfissionalPerfilAlterarFotoModal'
import { ProfissionalPerfilInfoTooltip } from './ProfissionalPerfilInfoTooltip'
import { profissionalPerfilCardClass, profissionalPerfilCardHeaderClass } from './profissionalPerfilUi'

const FOTO_TOOLTIP =
  'Sua foto é exibida na agenda, no prontuário e nas avaliações dos pacientes. Recomendamos imagem quadrada com pelo menos 400×400 px.'

type ProfissionalPerfilFotoCardProps = {
  avatarUrl: string
  onAvatarUrlChange: (url: string) => void
  onSaveFoto?: (previewDataUrl: string) => Promise<string>
}

export function ProfissionalPerfilFotoCard({
  avatarUrl,
  onAvatarUrlChange,
  onSaveFoto,
}: ProfissionalPerfilFotoCardProps) {
  const {
    avatarUrl: displayAvatarUrl,
    alterarFotoOpen,
    openAlterarFotoModal,
    closeAlterarFotoModal,
    saveAvatar,
  } = useProfissionalPerfilAvatar(avatarUrl, { onSaveFoto })

  async function handleSave(
    file: File,
    previewDataUrl: string,
    onProgress: (progress: number) => void,
  ) {
    await saveAvatar(file, previewDataUrl, onProgress)
    onAvatarUrlChange(previewDataUrl)
  }

  return (
    <>
      <section className={[profissionalPerfilCardClass, 'relative !overflow-visible'].join(' ')}>
        <ProfissionalPerfilInfoTooltip
          label="Informações sobre a foto do perfil"
          content={FOTO_TOOLTIP}
          className="absolute right-4 top-4 z-30"
        />

        <header className={profissionalPerfilCardHeaderClass}>
          <Camera className="h-[18px] w-[18px] shrink-0 text-[var(--brand-primary)]" strokeWidth={2} aria-hidden />
          <h2 className="pr-8 text-[15px] font-bold text-gray-900">Foto do perfil</h2>
        </header>

        <div className="flex justify-center px-5 pb-5 pt-1">
          <div className="relative">
            <div
              className={[
                'h-[7.75rem] w-[7.75rem] overflow-hidden rounded-full',
                'bg-gradient-to-br from-[var(--brand-primary-light)]/50 to-white',
                'shadow-[0_4px_20px_rgba(0,0,0,0.12)] ring-[3px] ring-white',
                'outline outline-[3px] outline-orange-100/90',
              ].join(' ')}
            >
              <img src={displayAvatarUrl} alt="" className="h-full w-full object-cover" />
            </div>

            <button
              type="button"
              onClick={openAlterarFotoModal}
              className={[
                'absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center justify-center gap-1.5',
                'min-w-[7.25rem] whitespace-nowrap rounded-full border-2 border-white bg-[var(--brand-primary)] px-4 py-1.5',
                'text-[11px] font-semibold text-white shadow-md',
                'transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]',
              ].join(' ')}
            >
              <Camera className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              Alterar foto
            </button>
          </div>
        </div>
      </section>

      <ProfissionalPerfilAlterarFotoModal
        open={alterarFotoOpen}
        currentAvatarUrl={displayAvatarUrl}
        onClose={closeAlterarFotoModal}
        onSave={handleSave}
      />
    </>
  )
}

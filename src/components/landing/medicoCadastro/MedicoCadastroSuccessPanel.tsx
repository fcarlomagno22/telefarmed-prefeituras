import { CheckCircle2, Mail } from 'lucide-react'
import { ClosureSuccessLottie } from '../../profissional/financeiro/ClosureSuccessLottie'

export function MedicoCadastroSuccessPanel() {
  return (
    <div
      className="flex flex-col items-center px-2 py-6 text-center sm:py-8"
      role="status"
      aria-live="polite"
    >
      <ClosureSuccessLottie />

      <h3 className="mt-2 text-xl font-bold text-gray-900 sm:text-[22px]">
        Cadastro enviado para análise!
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600 sm:text-[15px]">
        Recebemos seus dados e documentos. Nossa equipe fará a validação e você receberá o retorno
        por e-mail.
      </p>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 to-white px-4 py-4 text-left shadow-sm ring-1 ring-emerald-100/60">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Mail className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-900">Próximos passos</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-800">
              Em até <span className="font-semibold">2 dias úteis</span> enviaremos a resposta com
              o acesso à plataforma ou orientações, se necessário.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-emerald-100/80 pt-3 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Fique de olho na caixa de entrada e no spam.
        </div>
      </div>
    </div>
  )
}

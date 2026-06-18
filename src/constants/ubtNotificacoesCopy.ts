export function buildUbtCannotNotifyTelefarmedHint(platformOperatorLabel: string) {
  return `${platformOperatorLabel} não recebe mensagens enviadas por unidades. Para falar com a operadora, use Suporte técnico.`
}

/** @deprecated Preferir buildUbtCannotNotifyTelefarmedHint com rótulo dinâmico. */
export const ubtCannotNotifyTelefarmedHint =
  'A operadora da plataforma não recebe mensagens enviadas por unidades. Para falar com a operadora, use Suporte técnico.'

export const ubtProfissionaisRecipientHint =
  'Envie comunicados apenas para profissionais vinculados a esta unidade (credenciais de acesso da UBT).'

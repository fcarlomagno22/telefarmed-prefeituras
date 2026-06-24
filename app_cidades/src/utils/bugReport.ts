import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { menuSupportConfig } from '../config/menuSupport'

export type FeedbackReportType = 'bug' | 'suggestion'

export type BugReportPayload = {
  type: FeedbackReportType
  description: string
  screenName?: string
  evidenceUri?: string | null
  userName?: string
  userEmail?: string
}

function buildReportBody(payload: BugReportPayload): string {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'
  const typeLabel = payload.type === 'bug' ? 'Problema / bug' : 'Sugestão de melhoria'

  return [
    'Feedback do app Telefarmed Cidades',
    '',
    `Tipo: ${typeLabel}`,
    '',
    'Descrição:',
    payload.description.trim(),
    payload.screenName?.trim() ? `\nTela / funcionalidade:\n${payload.screenName.trim()}` : '',
    payload.evidenceUri ? '\nEvidência: imagem anexada neste e-mail.' : '',
    '',
    '---',
    `App: Telefarmed Cidades v${appVersion}`,
    `Plataforma: ${Platform.OS}`,
    payload.userName ? `Usuário: ${payload.userName}` : '',
    payload.userEmail ? `E-mail: ${payload.userEmail}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildReportSubject(type: FeedbackReportType): string {
  const prefix = type === 'bug' ? 'Bug report' : 'Sugestão'
  return `${prefix} — Telefarmed ${menuSupportConfig.municipalityName}`
}

export async function sendBugReport(payload: BugReportPayload): Promise<'sent'> {
  const subject = buildReportSubject(payload.type)
  const body = buildReportBody(payload)

  await new Promise((resolve) => setTimeout(resolve, 450))

  if (__DEV__) {
    console.log('[bugReport] feedback submitted', {
      subject,
      type: payload.type,
      description: payload.description.trim(),
      screenName: payload.screenName,
      hasEvidence: Boolean(payload.evidenceUri),
      body,
    })
  }

  return 'sent'
}

export function formatScreenLabel(screenId: string): string {
  return screenId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

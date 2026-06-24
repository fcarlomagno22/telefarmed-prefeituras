import Constants from 'expo-constants'
import * as MailComposer from 'expo-mail-composer'
import { Linking, Platform } from 'react-native'
import { buildSupportMailto, menuSupportConfig } from '../config/menuSupport'
import { openWhatsAppMessage } from './runWalkLocationShare'

export type SupportTopicId =
  | 'appointments'
  | 'account'
  | 'app'
  | 'program'
  | 'other'

export type SupportContactPreference = 'email' | 'whatsapp' | 'phone'

export type SupportTopic = {
  id: SupportTopicId
  label: string
  hint: string
  icon: string
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'appointments',
    label: 'Consultas',
    hint: 'Agendamento, remarcação ou dúvidas sobre atendimento',
    icon: 'calendar-outline',
  },
  {
    id: 'account',
    label: 'Minha conta',
    hint: 'Cadastro, login, dados pessoais ou foto de perfil',
    icon: 'person-outline',
  },
  {
    id: 'app',
    label: 'Uso do app',
    hint: 'Funcionalidades, métricas, rotina ou navegação',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'program',
    label: 'Programa',
    hint: 'Cobertura, prefeitura ou serviços disponíveis',
    icon: 'business-outline',
  },
  {
    id: 'other',
    label: 'Outro',
    hint: 'Qualquer outro assunto — estamos aqui para ajudar',
    icon: 'chatbubbles-outline',
  },
]

export type SupportRequestPayload = {
  topic: SupportTopicId
  message: string
  contactPreference: SupportContactPreference
  screenName?: string
  userName?: string
  userEmail?: string
  userPhone?: string
}

function getTopicLabel(topic: SupportTopicId): string {
  return SUPPORT_TOPICS.find((item) => item.id === topic)?.label ?? 'Suporte'
}

function buildSupportRequestBody(payload: SupportRequestPayload): string {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'
  const preferenceLabel =
    payload.contactPreference === 'whatsapp'
      ? 'WhatsApp'
      : payload.contactPreference === 'phone'
        ? 'Telefone'
        : 'E-mail'

  return [
    'Pedido de suporte — Telefarmed Cidades',
    '',
    `Assunto: ${getTopicLabel(payload.topic)}`,
    `Prefiro resposta por: ${preferenceLabel}`,
    '',
    'Mensagem:',
    payload.message.trim(),
    payload.screenName?.trim() ? `\nTela em que estava:\n${payload.screenName.trim()}` : '',
    '',
    '---',
    `App: Telefarmed Cidades v${appVersion}`,
    `Plataforma: ${Platform.OS}`,
    `Município: ${menuSupportConfig.municipalityName}`,
    payload.userName ? `Nome: ${payload.userName}` : '',
    payload.userEmail ? `E-mail: ${payload.userEmail}` : '',
    payload.userPhone ? `Telefone: ${payload.userPhone}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildSupportRequestSubject(topic: SupportTopicId): string {
  return `Suporte — ${getTopicLabel(topic)} — Telefarmed ${menuSupportConfig.municipalityName}`
}

async function sendSupportViaEmail(
  payload: SupportRequestPayload,
): Promise<'sent' | 'saved' | 'opened'> {
  const subject = buildSupportRequestSubject(payload.topic)
  const body = buildSupportRequestBody(payload)
  const isMailAvailable = await MailComposer.isAvailableAsync()

  if (isMailAvailable) {
    const result = await MailComposer.composeAsync({
      recipients: [menuSupportConfig.email],
      subject,
      body,
    })

    if (result.status === MailComposer.MailComposerStatus.SENT) return 'sent'
    if (result.status === MailComposer.MailComposerStatus.SAVED) return 'saved'
    if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
      throw new Error('cancelled')
    }

    return 'opened'
  }

  await Linking.openURL(buildSupportMailto(subject, body))
  return 'opened'
}

export async function sendSupportRequest(
  payload: SupportRequestPayload,
): Promise<'sent' | 'saved' | 'opened' | 'channel'> {
  const body = buildSupportRequestBody(payload)

  if (payload.contactPreference === 'whatsapp') {
    if (!menuSupportConfig.whatsApp) {
      return sendSupportViaEmail(payload)
    }

    await openWhatsAppMessage(menuSupportConfig.whatsApp, body)
    return 'channel'
  }

  if (payload.contactPreference === 'phone') {
    if (!menuSupportConfig.phone) {
      return sendSupportViaEmail(payload)
    }

    const digits = menuSupportConfig.phone.replace(/\D/g, '')
    await Linking.openURL(`tel:${digits}`)
    return 'channel'
  }

  return sendSupportViaEmail(payload)
}

export { formatScreenLabel } from './bugReport'

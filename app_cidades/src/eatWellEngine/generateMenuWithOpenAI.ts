import { getOpenAiConfig } from '../config/openai'
import type { EatWellSavedMenu } from '../types/eatWell'
import type { EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import {
  buildMenuAiRetryPrompt,
  buildMenuAiSystemPrompt,
  buildMenuAiUserPrompt,
} from './ai/buildMenuAiPrompt'
import {
  mapAiMenuResponseToSavedMenu,
  parseAiMenuJson,
  validateAiMenuResponse,
} from './ai/parseMenuAiResponse'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callOpenAiChat(messages: ChatMessage[]) {
  const { apiKey, model } = getOpenAiConfig()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  const payload = (await response.json()) as {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string } }>
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI HTTP ${response.status}`)
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI retornou resposta vazia.')
  }

  return content
}

export async function generateMenuWithOpenAI(
  form: EatWellMenuWizardForm,
  onProgress?: (progress: number) => void,
): Promise<EatWellSavedMenu> {
  const report = (value: number) => onProgress?.(Math.min(99, Math.max(0, value)))

  report(8)

  const messages: ChatMessage[] = [
    { role: 'system', content: buildMenuAiSystemPrompt() },
    { role: 'user', content: buildMenuAiUserPrompt(form) },
  ]

  report(15)

  let lastErrors: string[] = []

  for (let attempt = 0; attempt < 3; attempt += 1) {
    report(20 + attempt * 25)
    const content = await callOpenAiChat(messages)
    report(50 + attempt * 15)

    const parsed = parseAiMenuJson(content)
    const errors = validateAiMenuResponse(parsed, form)

    if (errors.length === 0) {
      report(100)
      return mapAiMenuResponseToSavedMenu(form, parsed)
    }

    lastErrors = errors
    messages.push({ role: 'assistant', content })
    messages.push({ role: 'user', content: buildMenuAiRetryPrompt(errors) })
  }

  throw new Error(
    lastErrors.length > 0
      ? `IA não gerou cardápio válido:\n${lastErrors.slice(0, 5).join('\n')}`
      : 'IA não gerou cardápio válido.',
  )
}

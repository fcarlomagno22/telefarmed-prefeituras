import { env } from './env'

export function getOpenAiConfig() {
  return {
    apiKey: env('EXPO_PUBLIC_OPENAI_API_KEY', ''),
    model: env('EXPO_PUBLIC_OPENAI_MODEL', 'gpt-4o-mini'),
  }
}

export function isOpenAiMenuGenerationEnabled() {
  const { apiKey } = getOpenAiConfig()
  return apiKey.startsWith('sk-')
}

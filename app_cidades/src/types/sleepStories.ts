import type { MaterialCommunityIcons } from '@expo/vector-icons'

export type SleepStoryCategoryId =
  | 'sleep-rest-routine'
  | 'fears-courage'
  | 'friendship-affection'
  | 'kindness-cooperation'
  | 'self-confidence'
  | 'nature-freedom'
  | 'imagination-magic'
  | 'adventures-curiosity'

export type SleepStoryId = `story-${number}`

export type SleepStoryCategory = {
  id: SleepStoryCategoryId
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  gradient: readonly [string, string, string]
}

export type SleepStory = {
  id: SleepStoryId
  number: number
  title: string
  summary: string
  categoryId: SleepStoryCategoryId
  isNew?: boolean
}

export type SleepStoryParagraphVariant = 'normal' | 'dialogue' | 'thought'

export type SleepStoryParagraph = {
  text: string
  variant: SleepStoryParagraphVariant
}

export type SleepStoryContent = {
  paragraphs: SleepStoryParagraph[]
  lesson?: {
    title: string
    text: string
  }
}

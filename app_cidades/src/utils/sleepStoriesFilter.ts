import type { SleepStory, SleepStoryCategoryId } from '../types/sleepStories'

function normalizeQuery(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function filterSleepStories(
  stories: SleepStory[],
  query: string,
  categoryId: SleepStoryCategoryId | null,
) {
  const normalizedQuery = normalizeQuery(query)

  return stories.filter((story) => {
    if (categoryId && story.categoryId !== categoryId) return false
    if (!normalizedQuery) return true

    const haystack = normalizeQuery(`${story.title} ${story.summary}`)
    return haystack.includes(normalizedQuery)
  })
}

import type { EatWellDailyRecord } from '../types/eatWell'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import { MOCK_FOOD_DATABASE, mockFoodToEntry } from './mockEatWellFoods'

function cloneEntry(foodId: string, entryId: string) {
  const food = MOCK_FOOD_DATABASE.find((item) => item.id === foodId)
  if (!food) throw new Error(`Missing mock food ${foodId}`)
  const entry = mockFoodToEntry(food)
  entry.id = entryId
  return entry
}

function getCurrentWeekDays(referenceDate = new Date()) {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + index)
    return {
      dateIso: toLocalDateIso(date),
      isFuture: date.getTime() > today.getTime(),
    }
  })
}

const WEEK_PROFILES: Array<(dateIso: string) => EatWellDailyRecord> = [
  (dateIso) => ({
    dateIso,
    meals: [
      {
        id: `seed-${dateIso}-breakfast`,
        slot: 'breakfast',
        loggedAt: `${dateIso}T07:20:00.000`,
        entries: [cloneEntry('food-bread', 'b1'), cloneEntry('food-egg', 'b2')],
      },
      {
        id: `seed-${dateIso}-lunch`,
        slot: 'lunch',
        loggedAt: `${dateIso}T12:30:00.000`,
        entries: [
          cloneEntry('food-rice', 'l1'),
          cloneEntry('food-beans', 'l2'),
          cloneEntry('food-chicken', 'l3'),
        ],
      },
      {
        id: `seed-${dateIso}-dinner`,
        slot: 'dinner',
        loggedAt: `${dateIso}T19:40:00.000`,
        entries: [cloneEntry('food-salad', 'd1'), cloneEntry('food-potato', 'd2')],
      },
    ],
    waterLogs: [
      { id: `w1-${dateIso}`, ml: 500, loggedAt: `${dateIso}T09:00:00.000` },
      { id: `w2-${dateIso}`, ml: 500, loggedAt: `${dateIso}T13:00:00.000` },
      { id: `w3-${dateIso}`, ml: 500, loggedAt: `${dateIso}T18:00:00.000` },
      { id: `w4-${dateIso}`, ml: 500, loggedAt: `${dateIso}T21:00:00.000` },
    ],
  }),
  (dateIso) => ({
    dateIso,
    meals: [
      {
        id: `seed-${dateIso}-breakfast`,
        slot: 'breakfast',
        loggedAt: `${dateIso}T08:00:00.000`,
        entries: [cloneEntry('food-bread', 'b1'), cloneEntry('food-cheese', 'b2')],
      },
      {
        id: `seed-${dateIso}-lunch`,
        slot: 'lunch',
        loggedAt: `${dateIso}T12:45:00.000`,
        entries: [cloneEntry('food-pasta', 'l1'), cloneEntry('food-salad', 'l2')],
      },
      {
        id: `seed-${dateIso}-snack`,
        slot: 'afternoon_snack',
        loggedAt: `${dateIso}T16:00:00.000`,
        entries: [cloneEntry('food-banana', 's1')],
      },
    ],
    waterLogs: [
      { id: `w1-${dateIso}`, ml: 250, loggedAt: `${dateIso}T10:00:00.000` },
      { id: `w2-${dateIso}`, ml: 250, loggedAt: `${dateIso}T15:00:00.000` },
    ],
  }),
  (dateIso) => ({
    dateIso,
    meals: [
      {
        id: `seed-${dateIso}-breakfast`,
        slot: 'breakfast',
        loggedAt: `${dateIso}T07:45:00.000`,
        entries: [cloneEntry('food-egg', 'b1')],
      },
      {
        id: `seed-${dateIso}-lunch`,
        slot: 'lunch',
        loggedAt: `${dateIso}T13:00:00.000`,
        entries: [
          cloneEntry('food-rice', 'l1'),
          cloneEntry('food-beans', 'l2'),
          cloneEntry('food-chicken', 'l3'),
          cloneEntry('food-salad', 'l4'),
        ],
      },
      {
        id: `seed-${dateIso}-dinner`,
        slot: 'dinner',
        loggedAt: `${dateIso}T20:00:00.000`,
        entries: [cloneEntry('food-potato', 'd1'), cloneEntry('food-oil', 'd2')],
      },
    ],
    waterLogs: [
      { id: `w1-${dateIso}`, ml: 500, loggedAt: `${dateIso}T08:30:00.000` },
      { id: `w2-${dateIso}`, ml: 750, loggedAt: `${dateIso}T14:30:00.000` },
      { id: `w3-${dateIso}`, ml: 750, loggedAt: `${dateIso}T19:30:00.000` },
    ],
  }),
  (dateIso) => ({
    dateIso,
    meals: [
      {
        id: `seed-${dateIso}-lunch`,
        slot: 'lunch',
        loggedAt: `${dateIso}T12:15:00.000`,
        entries: [cloneEntry('food-pasta', 'l1'), cloneEntry('food-soda', 'l2')],
      },
      {
        id: `seed-${dateIso}-snack`,
        slot: 'off_schedule',
        loggedAt: `${dateIso}T22:00:00.000`,
        entries: [cloneEntry('food-cheese', 's1')],
      },
    ],
    waterLogs: [{ id: `w1-${dateIso}`, ml: 500, loggedAt: `${dateIso}T12:00:00.000` }],
  }),
]

export function createVariedSeedDailyRecord(dateIso: string, profileIndex: number): EatWellDailyRecord {
  const profile = WEEK_PROFILES[profileIndex % WEEK_PROFILES.length]
  return profile(dateIso)
}

export function buildCurrentWeekSeedRecords(referenceDate = new Date()) {
  const days = getCurrentWeekDays(referenceDate)
  return days
    .filter((day) => !day.isFuture)
    .map((day, index) => createVariedSeedDailyRecord(day.dateIso, index))
}

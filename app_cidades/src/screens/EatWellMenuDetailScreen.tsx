import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActionToast } from '../components/ActionToast'
import { EatWellDayStrip } from '../components/eatWell/EatWellDayStrip'
import { EatWellMenuCalorieCard } from '../components/eatWell/menuDetail/EatWellMenuCalorieCard'
import { EatWellMenuMealDrawer } from '../components/eatWell/menuDetail/EatWellMenuMealDrawer'
import { EatWellMenuSubstituteDrawer } from '../components/eatWell/menuDetail/EatWellMenuSubstituteDrawer'
import { EatWellMenuMealSlotCard } from '../components/eatWell/menuDetail/EatWellMenuMealSlotCard'
import { EatWellMonthPickerDrawer } from '../components/eatWell/EatWellMonthPickerDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { loadEatWellMenuDayLog, loadEatWellMenuCalendarDayStatuses, setEatWellMenuEntryOverride, setEatWellMenuEntryStatus } from '../data/eatWellMenuDayStorage'
import { loadEatWellMenus } from '../data/eatWellMenusStorage'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { applyAndroidNavigationBar } from '../hooks/useAndroidNavigationBar'
import { colors } from '../theme/colors'
import type { EatWellMenuDayLog, EatWellMenuFoodStatus, EatWellSavedMenu, FoodEntry, MealSlot } from '../types/eatWell'
import { getEatWellRouteParams } from '../types/auth'
import {
  attachMenuCalendarDayStatuses,
  buildEatWellMonthDays,
  getCurrentMonthKey,
  getMonthKeyFromDateIso,
  pickDefaultDateIsoForMonth,
} from '../utils/eatWellCalendarDays'
import {
  computeMenuConsumedMacros,
  computeMenuDayCompletionStatus,
  countMenuMealStatuses,
  getMenuMealForSlot,
  MENU_DETAIL_SLOTS,
  resolveMealWithOverrides,
} from '../utils/eatWellMenuDetail'
import { getMenuObjectiveLabel } from '../utils/eatWellMenuWizard'
import { getModalFooterPadding } from '../utils/modalSafeArea'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

export function EatWellMenuDetailScreen() {
  const insets = useSafeAreaInsets()
  const { user, goBack, routeParams } = useAuth()
  const { menuId } = getEatWellRouteParams(routeParams)
  const patientCpf = user?.cpf ?? 'guest'

  const [menu, setMenu] = useState<EatWellSavedMenu | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDateIso, setSelectedDateIso] = useState(() => toLocalDateIso(new Date()))
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => getCurrentMonthKey())
  const [calendarDays, setCalendarDays] = useState(() =>
    buildEatWellMonthDays(getCurrentMonthKey()),
  )
  const [monthPickerVisible, setMonthPickerVisible] = useState(false)
  const [dayLog, setDayLog] = useState<EatWellMenuDayLog | null>(null)
  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot | null>(null)
  const [substituteDrawerVisible, setSubstituteDrawerVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [animateCalories, setAnimateCalories] = useState(true)

  const loadMenu = useCallback(async () => {
    if (!menuId) {
      goBack()
      return
    }

    const menus = await loadEatWellMenus(patientCpf)
    const found = menus.find((item) => item.id === menuId) ?? null
    setMenu(found)
    setIsLoading(false)

    if (!found) {
      goBack()
    }
  }, [goBack, menuId, patientCpf])

  const loadDayLog = useCallback(async () => {
    if (!menuId) return
    const log = await loadEatWellMenuDayLog(menuId, selectedDateIso)
    setDayLog(log)
  }, [menuId, selectedDateIso])

  const refreshCalendar = useCallback(async () => {
    if (!menuId || !menu) return

    const calendar = buildEatWellMonthDays(calendarMonthKey)
    const statuses = await loadEatWellMenuCalendarDayStatuses(menuId, menu, calendar)
    setCalendarDays(attachMenuCalendarDayStatuses(calendar, statuses))
  }, [calendarMonthKey, menu, menuId])

  function patchCalendarDayStatus(dateIso: string, log: EatWellMenuDayLog) {
    if (!menu) return
    const status = computeMenuDayCompletionStatus(menu, log)
    setCalendarDays((current) =>
      current.map((day) =>
        day.dateIso === dateIso
          ? { ...day, menuDotStatus: day.isFuture ? undefined : status }
          : day,
      ),
    )
  }

  useEffect(() => {
    applyAndroidNavigationBar()
  }, [])

  useEffect(() => {
    if (activeMealSlot || substituteDrawerVisible || monthPickerVisible) return
    applyAndroidNavigationBar()
  }, [activeMealSlot, monthPickerVisible, substituteDrawerVisible])

  useEffect(() => {
    void loadMenu()
  }, [loadMenu])

  useEffect(() => {
    if (!menu) return
    void refreshCalendar()
  }, [menu, refreshCalendar])

  useEffect(() => {
    void loadDayLog()
  }, [loadDayLog])

  const consumedCalories = useMemo(() => {
    if (!menu) return 0
    return Math.round(computeMenuConsumedMacros(menu, dayLog).calories)
  }, [dayLog, menu])

  const headerSubtitle = menu
    ? `${getMenuObjectiveLabel(menu.objective)} · ~${Math.round(menu.approximateCalories).toLocaleString('pt-BR')} kcal`
    : ''

  async function handleToggleEntryStatus(
    slot: MealSlot,
    entryId: string,
    status: EatWellMenuFoodStatus | null,
  ) {
    if (!menuId) return
    const next = await setEatWellMenuEntryStatus(menuId, selectedDateIso, slot, entryId, status)
    setDayLog(next)
    patchCalendarDayStatus(selectedDateIso, next)
    setAnimateCalories(true)
  }

  async function handleSubstituteConfirm(
    slot: MealSlot,
    originalEntryId: string,
    replacement: FoodEntry,
  ) {
    if (!menuId) return
    const next = await setEatWellMenuEntryOverride(
      menuId,
      selectedDateIso,
      slot,
      originalEntryId,
      replacement,
    )
    setDayLog(next)
    setSubstituteDrawerVisible(false)
    setToastMessage(`${replacement.name} substituiu o item na refeição.`)
    setAnimateCalories(true)
  }

  function handleApplyCalendarMonth(monthKey: string) {
    const nextDateIso = pickDefaultDateIsoForMonth(monthKey)
    setCalendarMonthKey(monthKey)
    setSelectedDateIso(nextDateIso)
    setMonthPickerVisible(false)
  }

  useAndroidBackHandler(
    useCallback(() => {
      if (monthPickerVisible) {
        setMonthPickerVisible(false)
        return true
      }
      if (substituteDrawerVisible) {
        setSubstituteDrawerVisible(false)
        return true
      }
      if (activeMealSlot) {
        setActiveMealSlot(null)
        return true
      }
      goBack()
      return true
    }, [activeMealSlot, goBack, monthPickerVisible, substituteDrawerVisible]),
  )

  if (isLoading || !menu) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primaryLight} size="large" />
      </View>
    )
  }

  const activeMeal = activeMealSlot ? getMenuMealForSlot(menu, activeMealSlot) : null
  const activeMealResolved =
    activeMealSlot && activeMeal
      ? resolveMealWithOverrides(activeMeal, dayLog, activeMealSlot)
      : null

  return (
    <>
      <View style={styles.root}>
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          imageStyle={styles.backgroundImage}
        />

        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'transparent', 'rgba(10, 10, 12, 0.75)']}
          locations={[0, 0.35, 1]}
          style={styles.screenOverlay}
          pointerEvents="none"
        />

        <ScreenStackHeader
          title={menu.name}
          subtitle={headerSubtitle}
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={goBack}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: getModalFooterPadding(insets.bottom, 24) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <EatWellDayStrip
            days={calendarDays}
            monthKey={calendarMonthKey}
            selectedDateIso={selectedDateIso}
            onSelectDate={(dateIso) => {
              setSelectedDateIso(dateIso)
              setCalendarMonthKey(getMonthKeyFromDateIso(dateIso))
            }}
            onOpenMonthPicker={() => setMonthPickerVisible(true)}
          />

          <EatWellMenuCalorieCard
            consumedCalories={consumedCalories}
            targetCalories={menu.approximateCalories}
            animate={animateCalories}
          />

          <View style={styles.mealsList}>
            {MENU_DETAIL_SLOTS.map((slot) => {
              const meal = getMenuMealForSlot(menu, slot)
              const resolvedMeal = resolveMealWithOverrides(meal, dayLog, slot)
              const counts = countMenuMealStatuses(meal, dayLog, slot)

              return (
                <EatWellMenuMealSlotCard
                  key={slot}
                  slot={slot}
                  meal={resolvedMeal}
                  consumedCount={counts.consumed}
                  totalCount={counts.total}
                  onPress={() => setActiveMealSlot(slot)}
                />
              )
            })}
          </View>
        </ScrollView>

        <ActionToast
          message={toastMessage}
          onHidden={() => setToastMessage(null)}
          bottomOffset={getModalFooterPadding(insets.bottom, 12)}
        />
      </View>

      <EatWellMenuMealDrawer
        visible={activeMealSlot != null}
        slot={activeMealSlot}
        meal={activeMealResolved}
        dayLog={dayLog}
        menuTargetCalories={menu.approximateCalories}
        onClose={() => setActiveMealSlot(null)}
        onToggleEntryStatus={(slot, entryId, status) =>
          void handleToggleEntryStatus(slot, entryId, status)
        }
        onSubstitutePress={() => setSubstituteDrawerVisible(true)}
      />

      <EatWellMenuSubstituteDrawer
        visible={substituteDrawerVisible}
        slot={activeMealSlot}
        meal={activeMealResolved}
        onClose={() => setSubstituteDrawerVisible(false)}
        onConfirmSubstitute={(slot, entryId, replacement) =>
          void handleSubstituteConfirm(slot, entryId, replacement)
        }
      />

      <EatWellMonthPickerDrawer
        visible={monthPickerVisible}
        monthKey={calendarMonthKey}
        onClose={() => setMonthPickerVisible(false)}
        onApply={handleApplyCalendarMonth}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    opacity: 0.35,
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: 14,
    paddingTop: 4,
  },
  mealsList: {
    gap: 8,
    paddingHorizontal: 16,
  },
})

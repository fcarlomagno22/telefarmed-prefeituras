import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { ActionToast } from '../components/ActionToast'
import { EatWellBalanceExplainDrawer } from '../components/eatWell/EatWellBalanceExplainDrawer'
import { EatWellBalanceHero } from '../components/eatWell/EatWellBalanceHero'
import { EatWellDayStrip } from '../components/eatWell/EatWellDayStrip'
import { EatWellFab } from '../components/eatWell/EatWellFab'
import { EatWellFabPopover } from '../components/eatWell/EatWellFabPopover'
import { EatWellMacroDetailDrawer } from '../components/eatWell/EatWellMacroDetailDrawer'
import { EatWellMealContributionDonut } from '../components/eatWell/EatWellMealContributionDonut'
import { EatWellMealDetailDrawer } from '../components/eatWell/EatWellMealDetailDrawer'
import { EatWellMealLogDrawer } from '../components/eatWell/EatWellMealLogDrawer'
import { EatWellMealPhotoGallery } from '../components/eatWell/EatWellMealPhotoGallery'
import { EatWellMealTimeline } from '../components/eatWell/EatWellMealTimeline'
import { EatWellMonthPickerDrawer } from '../components/eatWell/EatWellMonthPickerDrawer'
import { EatWellQuickMealOverlay } from '../components/eatWell/EatWellQuickMealOverlay'
import { EatWellRunWalkEnergyBadge } from '../components/eatWell/EatWellRunWalkEnergyBadge'
import { EatWellRunWalkEnergyDrawer } from '../components/eatWell/EatWellRunWalkEnergyDrawer'
import { EatWellWaterStrip } from '../components/eatWell/EatWellWaterStrip'
import { HydrationLogDrawer } from '../components/metrics/HydrationLogDrawer'
import { EatWellWeekTab } from '../components/eatWell/week/EatWellWeekTab'
import { EatWellMenusTab } from '../components/eatWell/menus/EatWellMenusTab'
import { EatWellMenuWizardDrawer } from '../components/eatWell/menuWizard/EatWellMenuWizardDrawer'
import { MenuDrawer } from '../components/MenuDrawer'
import { RunWalkSegmentTabs, type RunWalkSegmentTabItem } from '../components/runWalk/RunWalkSegmentTabs'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import {
  loadEatWellDailyRecord,
  saveEatWellDailyRecord,
} from '../data/eatWellDailyStorage'
import { loadEatWellFavorites } from '../data/eatWellFavoritesStorage'
import { addEatWellMenu, deleteEatWellMenu, loadEatWellMenus } from '../data/eatWellMenusStorage'
import { loadNutritionGoals, saveNutritionGoals } from '../data/eatWellGoalsStorage'
import { computeNutritionGoalsFromWizard, generateEatWellMenuFromWizard } from '../eatWellEngine'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import type {
  EatWellDailyRecord,
  EatWellFavorite,
  EatWellMealBeverage,
  EatWellMealFeeling,
  EatWellPortionSize,
  EatWellSavedMenu,
  EatWellTab,
  EatWellWeekSummary,
  FoodEntry,
  MacroChipId,
  MealLog,
  MealSlot,
  NutritionGoals,
  RunWalkDayEnergy,
} from '../types/eatWell'
import {
  computeBalanceScore,
  computeAllMealContributions,
  computeDailyTotals,
} from '../utils/eatWellNutritionStats'
import {
  attachCalendarDayFlags,
  buildEatWellMonthDays,
  getCurrentMonthKey,
  getMonthKeyFromDateIso,
  loadEatWellCalendarDayFlags,
  pickDefaultDateIsoForMonth,
} from '../utils/eatWellCalendarDays'
import { getAdjustedCalorieTarget, loadRunWalkDayEnergy } from '../utils/eatWellRunWalkCorrelation'
import { loadEatWellWeekSummary } from '../utils/eatWellWeekStats'
import type { EatWellMenuWizardForm } from '../utils/eatWellMenuWizard'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78
const SEGMENT_PAGES: EatWellTab[] = ['diary', 'week', 'menus']

const EAT_WELL_TABS: RunWalkSegmentTabItem<EatWellTab>[] = [
  { id: 'diary', label: 'Diário', available: true },
  { id: 'week', label: 'Semana', available: true },
  { id: 'menus', label: 'Meus Cardápios', available: true },
]

function upsertMeal(record: EatWellDailyRecord, meal: MealLog): EatWellDailyRecord {
  const withoutSlot = record.meals.filter(
    (item) => item.slot !== meal.slot && item.id !== meal.id,
  )
  return {
    ...record,
    meals: [...withoutSlot, meal],
  }
}

export function EatWellScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, goBack, canGoBack, logout } = useAuth()

  const [segmentTab, setSegmentTab] = useState<EatWellTab>('diary')
  const [menuVisible, setMenuVisible] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [selectedDateIso, setSelectedDateIso] = useState(() => toLocalDateIso(new Date()))
  const [dailyRecord, setDailyRecord] = useState<EatWellDailyRecord>(() => ({
    dateIso: toLocalDateIso(new Date()),
    meals: [],
    waterLogs: [],
  }))
  const [goals, setGoals] = useState<NutritionGoals | null>(null)
  const [favorites, setFavorites] = useState<EatWellFavorite[]>([])
  const [savedMenus, setSavedMenus] = useState<EatWellSavedMenu[]>([])
  const [runWalkEnergy, setRunWalkEnergy] = useState<RunWalkDayEnergy>({
    totalCaloriesBurned: 0,
    activities: [],
  })
  const [calendarDays, setCalendarDays] = useState(() =>
    buildEatWellMonthDays(getCurrentMonthKey()),
  )
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => getCurrentMonthKey())
  const [monthPickerVisible, setMonthPickerVisible] = useState(false)

  const [filterSlot, setFilterSlot] = useState<MealSlot | null>(null)
  const [fabMenuVisible, setFabMenuVisible] = useState(false)
  const [menuWizardVisible, setMenuWizardVisible] = useState(false)
  const [quickMealVisible, setQuickMealVisible] = useState(false)
  const [mealLogVisible, setMealLogVisible] = useState(false)
  const [mealLogSlot, setMealLogSlot] = useState<MealSlot | null>(null)
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null)
  const [balanceDrawerVisible, setBalanceDrawerVisible] = useState(false)
  const [macroDrawerId, setMacroDrawerId] = useState<MacroChipId | null>(null)
  const [energyDrawerVisible, setEnergyDrawerVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [segmentPagerScrollEnabled, setSegmentPagerScrollEnabled] = useState(true)
  const [animateHero, setAnimateHero] = useState(false)
  const [weekSummary, setWeekSummary] = useState<EatWellWeekSummary | null>(null)
  const [isWeekRefreshing, setIsWeekRefreshing] = useState(false)
  const [hydrationDrawerVisible, setHydrationDrawerVisible] = useState(false)
  const [mealDetailVisible, setMealDetailVisible] = useState(false)
  const [selectedMealDetail, setSelectedMealDetail] = useState<MealLog | null>(null)
  const [diaryAnimationEpoch, setDiaryAnimationEpoch] = useState(0)

  const segmentPagerRef = useRef<FlatList<EatWellTab>>(null)
  const segmentPagerIndexRef = useRef(0)
  const segmentPagerProgrammaticScrollRef = useRef(false)
  const skipDiaryResetRef = useRef(false)
  const replayDiaryAnimationRef = useRef(false)

  const { requireAuth } = useGuestAuth()
  const withEatWellAuth = (action: () => void) => {
    requireAuth('vida:eat-well', action)
  }

  const patientCpf = user?.cpf ?? 'guest'
  const fabBottomOffset = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12
  const bottomContentPadding = fabBottomOffset + 88
  const weekBottomPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12

  const scrollSegmentPagerTo = useCallback(
    (tab: EatWellTab, animated = true) => {
      const index = SEGMENT_PAGES.indexOf(tab)
      if (index < 0) return

      segmentPagerProgrammaticScrollRef.current = animated
      segmentPagerIndexRef.current = index
      segmentPagerRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated,
      })

      if (!animated) {
        segmentPagerProgrammaticScrollRef.current = false
      }
    },
    [screenWidth],
  )

  const handleSegmentTabChange = useCallback(
    (tab: EatWellTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(Math.max(nextIndex, 0), SEGMENT_PAGES.length - 1)
      const nextTab = SEGMENT_PAGES[clampedIndex] ?? 'diary'

      segmentPagerIndexRef.current = clampedIndex

      setSegmentTab((current) => {
        if (current === nextTab) return current
        if (options?.haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        return nextTab
      })
    },
    [],
  )

  const handleSegmentPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (segmentPagerProgrammaticScrollRef.current) return

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex)
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  const handleSegmentPagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const wasProgrammatic = segmentPagerProgrammaticScrollRef.current
      segmentPagerProgrammaticScrollRef.current = false

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex, { haptic: !wasProgrammatic })
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  const loadWeekData = useCallback(async () => {
    const summary = await loadEatWellWeekSummary(patientCpf)
    setWeekSummary(summary)
  }, [patientCpf])

  const loadDayData = useCallback(async () => {
    const calendar = buildEatWellMonthDays(calendarMonthKey)
    const [record, nutritionGoals, favoriteMeals, menuPlans, energy, dayFlags] = await Promise.all([
      loadEatWellDailyRecord(patientCpf, selectedDateIso),
      loadNutritionGoals(patientCpf),
      loadEatWellFavorites(patientCpf),
      loadEatWellMenus(patientCpf),
      loadRunWalkDayEnergy(patientCpf, selectedDateIso),
      loadEatWellCalendarDayFlags(patientCpf, calendar),
    ])

    setDailyRecord(record)
    setGoals(nutritionGoals)
    setFavorites(favoriteMeals)
    setSavedMenus(menuPlans)
    setRunWalkEnergy(energy)
    setCalendarDays(attachCalendarDayFlags(calendar, dayFlags))
    setIsReady(true)

    if (replayDiaryAnimationRef.current) {
      replayDiaryAnimationRef.current = false
      setAnimateHero(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateHero(true))
      })
      return
    }

    setAnimateHero(true)
  }, [patientCpf, selectedDateIso, calendarMonthKey])

  useEffect(() => {
    if (segmentTab !== 'diary') return
    if (skipDiaryResetRef.current) {
      skipDiaryResetRef.current = false
      return
    }

    const todayIso = toLocalDateIso(new Date())
    setSelectedDateIso(todayIso)
    setCalendarMonthKey(getCurrentMonthKey())
  }, [segmentTab])

  useEffect(() => {
    void loadDayData()
  }, [loadDayData])

  useEffect(() => {
    void loadWeekData()
  }, [loadWeekData])

  const totals = useMemo(() => computeDailyTotals(dailyRecord), [dailyRecord])
  const adjustedCalorieTarget = useMemo(
    () => getAdjustedCalorieTarget(goals?.baseCalories ?? 2200, runWalkEnergy.totalCaloriesBurned),
    [goals?.baseCalories, runWalkEnergy.totalCaloriesBurned],
  )
  const balance = useMemo(
    () =>
      computeBalanceScore(
        totals,
        goals ?? {
          baseCalories: 2200,
          proteinG: 120,
          carbsG: 260,
          fatG: 70,
          fiberG: 25,
          sugarsMaxG: 50,
          saturatedFatMaxG: 22,
          waterMl: 2000,
        },
        adjustedCalorieTarget,
      ),
    [totals, goals, adjustedCalorieTarget],
  )
  const contributions = useMemo(() => computeAllMealContributions(dailyRecord), [dailyRecord])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
  }, [])

  const handleToastHidden = useCallback(() => {
    setToastMessage(null)
  }, [])

  async function persistRecord(nextRecord: EatWellDailyRecord, notice?: string) {
    setDailyRecord(nextRecord)
    await saveEatWellDailyRecord(patientCpf, nextRecord)
    if (notice) showToast(notice)
    setAnimateHero(true)
    await Promise.all([loadDayData(), loadWeekData()])
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    await Promise.all([loadDayData(), loadWeekData()])
    setIsRefreshing(false)
  }

  async function handleWeekRefresh() {
    setIsWeekRefreshing(true)
    await loadWeekData()
    setIsWeekRefreshing(false)
  }

  function handleSelectDayFromWeek(dateIso: string) {
    skipDiaryResetRef.current = true
    setSelectedDateIso(dateIso)
    setCalendarMonthKey(getMonthKeyFromDateIso(dateIso))
    setFilterSlot(null)
    handleSegmentTabChange('diary')
  }

  function handleApplyCalendarMonth(nextMonthKey: string) {
    setMonthPickerVisible(false)
    setFilterSlot(null)
    setAnimateHero(false)
    replayDiaryAnimationRef.current = true
    setDiaryAnimationEpoch((value) => value + 1)
    setCalendarMonthKey(nextMonthKey)
    setSelectedDateIso(pickDefaultDateIsoForMonth(nextMonthKey))
  }

  function handleBack() {
    if (canGoBack()) goBack()
    else navigateTo('home')
  }

  function openMealDetail(meal: MealLog) {
    withEatWellAuth(() => {
      setSelectedMealDetail(meal)
      setMealDetailVisible(true)
    })
  }

  function openMealLog(slot: MealSlot, meal: MealLog | null = null) {
    withEatWellAuth(() => {
      setMealLogSlot(slot)
      setEditingMeal(meal)
      setMealLogVisible(true)
    })
  }

  function closeMealLogDrawer() {
    setMealLogVisible(false)
    setMealLogSlot(null)
    setEditingMeal(null)
  }

  function finishMealLogDrawer() {
    closeMealLogDrawer()
    handleSegmentTabChange('diary')
  }

  async function handleSaveMeal(payload: {
    slot: MealSlot
    entries: FoodEntry[]
    mealId?: string
    photoUri?: string | null
    portionSize?: EatWellPortionSize
    feeling?: EatWellMealFeeling | null
    beverage?: EatWellMealBeverage | null
  }) {
    withEatWellAuth(() => {
      void (async () => {
        const meal: MealLog = {
          id: payload.mealId ?? `meal-${payload.slot}-${Date.now()}`,
          slot: payload.slot,
          loggedAt: new Date().toISOString(),
          entries: payload.entries.map((entry) => ({ ...entry })),
          photoUri: payload.photoUri ?? null,
          portionSize: payload.portionSize,
          feeling: payload.feeling ?? null,
          beverage: payload.beverage ?? null,
        }
        const nextRecord = upsertMeal(dailyRecord, meal)
        await persistRecord(nextRecord, 'Refeição registrada.')
      })()
    })
  }

  async function handleDeleteMeal(mealId: string) {
    withEatWellAuth(() => {
      void (async () => {
        const nextRecord = {
          ...dailyRecord,
          meals: dailyRecord.meals.filter((meal) => meal.id !== mealId),
        }
        await persistRecord(nextRecord, 'Refeição removida.')
      })()
    })
  }

  async function handleAddWater(ml: number) {
    withEatWellAuth(() => {
      void (async () => {
        const nextRecord: EatWellDailyRecord = {
          ...dailyRecord,
          waterLogs: [
            ...dailyRecord.waterLogs,
            { id: `water-${Date.now()}`, ml, loggedAt: new Date().toISOString() },
          ],
        }
        await persistRecord(nextRecord, 'Água registrada')
      })()
    })
  }

  async function handleUndoWater() {
    withEatWellAuth(() => {
      void (async () => {
        if (dailyRecord.waterLogs.length === 0) return
        const nextRecord = {
          ...dailyRecord,
          waterLogs: dailyRecord.waterLogs.slice(0, -1),
        }
        await persistRecord(nextRecord, 'Último registro de água desfeito.')
      })()
    })
  }

  async function handleMenuWizardComplete(form: EatWellMenuWizardForm) {
    withEatWellAuth(() => {
      void (async () => {
        const menu = generateEatWellMenuFromWizard(form)
        const nextGoals = computeNutritionGoalsFromWizard(form)
        const nextMenus = await addEatWellMenu(patientCpf, menu)
        await saveNutritionGoals(patientCpf, nextGoals)
        setGoals(nextGoals)
        setSavedMenus(nextMenus)
        setMenuWizardVisible(false)
        handleSegmentTabChange('menus')
        setToastMessage(`"${menu.name}" foi adicionado aos seus cardápios.`)
      })()
    })
  }

  async function handleDeleteMenu(menuId: string) {
    withEatWellAuth(() => {
      void (async () => {
        const nextMenus = await deleteEatWellMenu(patientCpf, menuId)
        setSavedMenus(nextMenus)
        setToastMessage('Cardápio excluído.')
      })()
    })
  }

  function handleOpenMenu(menu: EatWellSavedMenu) {
    withEatWellAuth(() => {
      navigateTo('eat-well-menu', { menuId: menu.id })
    })
  }

  async function handleQuickFavorite(favorite: EatWellFavorite) {
    withEatWellAuth(() => {
      void (async () => {
        const meal: MealLog = {
          id: `meal-quick-${Date.now()}`,
          slot: favorite.slot,
          loggedAt: new Date().toISOString(),
          entries: favorite.entries.map((entry) => ({
            ...entry,
            id: `${entry.id}-${Date.now()}`,
          })),
        }
        const nextRecord = upsertMeal(dailyRecord, meal)
        await persistRecord(nextRecord, `${favorite.label} registrado rapidamente.`)
      })()
    })
  }

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }
    setMenuVisible(false)
    if (tab === 'home') navigateTo('home')
    else if (tab === 'my-metrics') navigateTo('my-metrics')
    else if (tab === 'agendar') navigateTo('schedule-appointment')
    else if (tab === 'pos-consulta') navigateTo('post-consultation')
  }

  useAndroidBackHandler(() => {
    if (menuWizardVisible) {
      setMenuWizardVisible(false)
      return true
    }
    if (quickMealVisible) {
      setQuickMealVisible(false)
      return true
    }
    if (fabMenuVisible) {
      setFabMenuVisible(false)
      return true
    }
    if (mealLogVisible) {
      setMealLogVisible(false)
      return true
    }
    if (balanceDrawerVisible) {
      setBalanceDrawerVisible(false)
      return true
    }
    if (macroDrawerId) {
      setMacroDrawerId(null)
      return true
    }
    if (energyDrawerVisible) {
      setEnergyDrawerVisible(false)
      return true
    }
    if (menuVisible) {
      setMenuVisible(false)
      return true
    }
    handleBack()
    return true
  })

  const diaryVisualKey = `${selectedDateIso}-${diaryAnimationEpoch}`
  const diaryAnimate = isReady && animateHero && segmentTab === 'diary'

  if (!goals) {
    return <View style={styles.root} />
  }

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
          title="Comer Bem"
          subtitle="Diário · Semana · Meus Cardápios"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <RunWalkSegmentTabs activeTab={segmentTab} onChange={handleSegmentTabChange} tabs={EAT_WELL_TABS} />

        <FlatList
          ref={segmentPagerRef}
          data={SEGMENT_PAGES}
          keyExtractor={(item) => item}
          horizontal
          pagingEnabled
          scrollEnabled={segmentPagerScrollEnabled}
          nestedScrollEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleSegmentPagerScroll}
          onMomentumScrollEnd={handleSegmentPagerScrollEnd}
          onScrollEndDrag={handleSegmentPagerScrollEnd}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          style={styles.segmentPager}
          renderItem={({ item }) => (
            <View style={[styles.segmentPage, { width: screenWidth, height: '100%' }]}>
              {item === 'diary' ? (
                <ScrollView
                  style={styles.body}
                  contentContainerStyle={[
                    styles.bodyContent,
                    { paddingBottom: bottomContentPadding },
                  ]}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={() => void handleRefresh()}
                      tintColor={colors.primaryLight}
                    />
                  }
                >
                  <EatWellDayStrip
                    days={calendarDays}
                    monthKey={calendarMonthKey}
                    selectedDateIso={selectedDateIso}
                    onSelectDate={setSelectedDateIso}
                    onOpenMonthPicker={() => setMonthPickerVisible(true)}
                    onHorizontalScrollActive={(active) => setSegmentPagerScrollEnabled(!active)}
                  />

                  <EatWellBalanceHero
                    key={`balance-${diaryVisualKey}`}
                    totals={totals}
                    goals={goals}
                    adjustedCalorieTarget={adjustedCalorieTarget}
                    balance={balance}
                    animate={diaryAnimate}
                    onBalancePress={() => setBalanceDrawerVisible(true)}
                    onMacroChipPress={setMacroDrawerId}
                  />

                  <EatWellRunWalkEnergyBadge
                    energy={runWalkEnergy}
                    adjustedCalorieTarget={adjustedCalorieTarget}
                    onPress={() => withEatWellAuth(() => setEnergyDrawerVisible(true))}
                  />

                  <EatWellMealContributionDonut
                    key={`donut-${diaryVisualKey}`}
                    contributions={contributions}
                    totalCalories={totals.calories}
                    selectedSlot={filterSlot}
                    onSelectSlot={setFilterSlot}
                    animate={diaryAnimate}
                  />

                  <EatWellWaterStrip
                    key={`water-${diaryVisualKey}`}
                    consumedMl={totals.waterMl}
                    goalMl={goals.waterMl}
                    animate={diaryAnimate}
                    onRegisterPress={() => setHydrationDrawerVisible(true)}
                    onUndoLast={() => void handleUndoWater()}
                    canUndo={dailyRecord.waterLogs.length > 0}
                  />

                  <EatWellMealTimeline
                    record={dailyRecord}
                    filterSlot={filterSlot}
                    onAddMeal={(slot) => openMealLog(slot)}
                    onEditMeal={(meal) => openMealLog(meal.slot, meal)}
                    onDeleteMeal={(mealId) => void handleDeleteMeal(mealId)}
                  />

                  <EatWellMealPhotoGallery
                    record={dailyRecord}
                    filterSlot={filterSlot}
                    onSelectMeal={openMealDetail}
                  />

                </ScrollView>
              ) : item === 'week' ? (
                <EatWellWeekTab
                  summary={weekSummary}
                  goals={goals}
                  bottomPadding={weekBottomPadding}
                  isActive={segmentTab === 'week'}
                  isRefreshing={isWeekRefreshing}
                  onRefresh={() => void handleWeekRefresh()}
                  onSelectDay={handleSelectDayFromWeek}
                  onNavigateRunWalk={() => navigateTo('run-walk')}
                  onHorizontalScrollActive={(active) => setSegmentPagerScrollEnabled(!active)}
                />
              ) : (
                <EatWellMenusTab
                  menus={savedMenus}
                  bottomPadding={bottomContentPadding}
                  onOpenMenu={handleOpenMenu}
                  onDeleteMenu={(menuId) => void handleDeleteMenu(menuId)}
                />
              )}
            </View>
          )}
        />

        {segmentTab === 'diary' || segmentTab === 'menus' ? (
          <EatWellFab
            bottom={fabBottomOffset}
            onPress={() => {
              withEatWellAuth(() => {
                if (segmentTab === 'menus') {
                  setMenuWizardVisible(true)
                  return
                }
                setFabMenuVisible(true)
              })
            }}
            onLongPress={() => {
              if (segmentTab === 'diary') {
                withEatWellAuth(() => setQuickMealVisible(true))
              }
            }}
          />
        ) : null}

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

        <ActionToast
          message={toastMessage}
          onHidden={handleToastHidden}
          bottomOffset={TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12}
        />
      </View>

      <EatWellFabPopover
        visible={fabMenuVisible}
        fabBottom={fabBottomOffset}
        onClose={() => setFabMenuVisible(false)}
        onRegisterMeal={(slot) => openMealLog(slot)}
      />

      <EatWellQuickMealOverlay
        visible={quickMealVisible}
        favorites={favorites}
        onClose={() => setQuickMealVisible(false)}
        onSelectFavorite={(favorite) => void handleQuickFavorite(favorite)}
        onAddWater={(ml) => void handleAddWater(ml)}
      />

      <EatWellMealLogDrawer
        visible={mealLogVisible}
        slot={mealLogSlot}
        initialMeal={editingMeal}
        onClose={closeMealLogDrawer}
        onFinish={finishMealLogDrawer}
        onSave={(payload) => void handleSaveMeal(payload)}
      />

      <EatWellMealDetailDrawer
        visible={mealDetailVisible}
        meal={selectedMealDetail}
        onClose={() => {
          setMealDetailVisible(false)
          setSelectedMealDetail(null)
        }}
        onEdit={(meal) => {
          setMealDetailVisible(false)
          setSelectedMealDetail(null)
          openMealLog(meal.slot, meal)
        }}
        onDelete={(mealId) => void handleDeleteMeal(mealId)}
      />

      <EatWellBalanceExplainDrawer
        visible={balanceDrawerVisible}
        balance={balance}
        onClose={() => setBalanceDrawerVisible(false)}
      />

      <EatWellMacroDetailDrawer
        visible={macroDrawerId != null}
        macroId={macroDrawerId}
        totals={totals}
        goals={goals}
        meals={dailyRecord.meals}
        onClose={() => setMacroDrawerId(null)}
      />

      <EatWellRunWalkEnergyDrawer
        visible={energyDrawerVisible}
        energy={runWalkEnergy}
        baseCalories={goals.baseCalories}
        adjustedCalorieTarget={adjustedCalorieTarget}
        onClose={() => setEnergyDrawerVisible(false)}
      />

      <HydrationLogDrawer
        visible={hydrationDrawerVisible}
        onClose={() => setHydrationDrawerVisible(false)}
        onRegister={(ml) => {
          setHydrationDrawerVisible(false)
          void handleAddWater(ml)
        }}
      />

      <EatWellMonthPickerDrawer
        visible={monthPickerVisible}
        monthKey={calendarMonthKey}
        onClose={() => setMonthPickerVisible(false)}
        onApply={handleApplyCalendarMonth}
      />

      <EatWellMenuWizardDrawer
        visible={menuWizardVisible}
        onClose={() => setMenuWizardVisible(false)}
        onComplete={(form) => void handleMenuWizardComplete(form)}
      />

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={() => void logout()}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
  },
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    gap: 14,
    paddingTop: 4,
  },
})

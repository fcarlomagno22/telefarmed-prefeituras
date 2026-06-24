import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppointmentDocumentsDrawer } from '../components/appointments/AppointmentDocumentsDrawer'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { ConsultationDocumentsCard } from '../components/documents/ConsultationDocumentsCard'
import { DocumentFlatRow } from '../components/documents/DocumentFlatRow'
import { DocumentsDisclaimer } from '../components/documents/DocumentsDisclaimer'
import { DocumentsEmptyState } from '../components/documents/DocumentsEmptyState'
import { DocumentsKindFilterChips } from '../components/documents/DocumentsKindFilterChips'
import { DocumentsProviderFilterDrawer } from '../components/documents/DocumentsProviderFilterDrawer'
import { DocumentsSegmentTabs } from '../components/documents/DocumentsSegmentTabs'
import { MenuDrawer } from '../components/MenuDrawer'
import { MetricsPeriodDrawer } from '../components/metrics/MetricsPeriodDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { SkeletonBone } from '../components/SkeletonBone'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useSimulatedPageSkeleton } from '../hooks/useSimulatedPageSkeleton'
import { colors } from '../theme/colors'
import type { ConsultationDocumentPdf } from '../types/appointmentDocuments'
import type {
  ConsultationDocumentsEntry,
  DocumentKindFilter,
  MyDocumentsTab,
  PatientProviderFilter,
} from '../types/myDocuments'
import { StoredAppointment } from '../types/myAppointments'
import { PeriodSelection } from '../types/metrics'
import {
  fetchPatientDocumentConsultations,
  filterConsultationEntriesByPeriod,
  filterConsultationEntriesByProvider,
  filterFlatDocumentsByKind,
  flattenDocumentEntries,
  formatProviderFilterLabel,
  getConsultationDateKeys,
  getLatestDocumentEntry,
  getPatientProviderOptions,
} from '../utils/myDocuments'
import { buildPeriodSelection, formatPeriodLabel } from '../utils/metricsPeriod'
import { downloadConsultationDocumentPdf } from '../utils/consultationDocumentPdf'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78
const DOCUMENTS_SEGMENT_PAGES: MyDocumentsTab[] = ['by-consultation', 'by-document']

export function MyDocumentsScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, logout } = useAuth()
  const { requireAuth } = useGuestAuth()

  const [entries, setEntries] = useState<ConsultationDocumentsEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [segmentTab, setSegmentTab] = useState<MyDocumentsTab>('by-consultation')
  const segmentPagerRef = useRef<FlatList<MyDocumentsTab>>(null)
  const segmentPagerProgrammaticScrollRef = useRef(false)
  const [kindFilter, setKindFilter] = useState<DocumentKindFilter>('all')
  const [period, setPeriod] = useState<PeriodSelection | null>(null)
  const [periodDrawerVisible, setPeriodDrawerVisible] = useState(false)
  const [providerFilter, setProviderFilter] = useState<PatientProviderFilter | null>(null)
  const [providerDrawerVisible, setProviderDrawerVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [documentsTarget, setDocumentsTarget] = useState<StoredAppointment | null>(null)
  const [documentsVisible, setDocumentsVisible] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const showSkeleton = useSimulatedPageSkeleton(isLoading)
  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24

  const loadDocuments = useCallback(
    async (refresh = false) => {
      if (!user) {
        setEntries([])
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const data = await fetchPatientDocumentConsultations(user.cpf)
        setEntries(data)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [user],
  )

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const consultationDateKeys = useMemo(() => getConsultationDateKeys(entries), [entries])
  const providerOptions = useMemo(() => getPatientProviderOptions(entries), [entries])
  const filteredEntries = useMemo(() => {
    const byPeriod = filterConsultationEntriesByPeriod(entries, period)
    return filterConsultationEntriesByProvider(byPeriod, providerFilter)
  }, [entries, period, providerFilter])
  const heroEntry = useMemo(() => getLatestDocumentEntry(filteredEntries), [filteredEntries])
  const listEntries = useMemo(() => {
    if (!heroEntry || segmentTab !== 'by-consultation') return filteredEntries
    return filteredEntries.filter(
      (entry) => entry.appointment.id !== heroEntry.appointment.id,
    )
  }, [filteredEntries, heroEntry, segmentTab])

  const flatDocuments = useMemo(() => {
    const items = flattenDocumentEntries(filteredEntries)
    return filterFlatDocumentsByKind(items, kindFilter)
  }, [filteredEntries, kindFilter])

  const kindCounts = useMemo(() => {
    const items = flattenDocumentEntries(filteredEntries)
    return {
      all: items.length,
      prescription: items.filter((item) => item.document.kind === 'prescription').length,
      exam: items.filter((item) => item.document.kind === 'exam').length,
      certificate: items.filter((item) => item.document.kind === 'certificate').length,
    }
  }, [filteredEntries])

  const periodDraft = period ?? buildPeriodSelection('last30days')
  const periodFilterActive = period !== null
  const providerFilterActive = providerFilter !== null
  const anyFilterActive = periodFilterActive || providerFilterActive

  const scrollSegmentPagerTo = useCallback(
    (tab: MyDocumentsTab, animated = true) => {
      const index = DOCUMENTS_SEGMENT_PAGES.indexOf(tab)
      if (index < 0) return

      segmentPagerProgrammaticScrollRef.current = animated
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
    (tab: MyDocumentsTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(
        Math.max(nextIndex, 0),
        DOCUMENTS_SEGMENT_PAGES.length - 1,
      )
      const nextTab = DOCUMENTS_SEGMENT_PAGES[clampedIndex] ?? 'by-consultation'

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

  useEffect(() => {
    scrollSegmentPagerTo(segmentTab, false)
  }, [screenWidth, scrollSegmentPagerTo, segmentTab])

  function clearFilters() {
    setPeriod(null)
    setProviderFilter(null)
  }

  function handleBack() {
    navigateTo('home')
  }

  function openDocumentsDrawer(appointment: StoredAppointment) {
    requireAuth('quick:prescriptions', () => {
      setDocumentsTarget(appointment)
      setDocumentsVisible(true)
    })
  }

  function closeDocumentsDrawer() {
    setDocumentsVisible(false)
    setDocumentsTarget(null)
  }

  async function handleDownloadFlatDocument(
    document: ConsultationDocumentPdf,
    appointment: StoredAppointment,
  ) {
    requireAuth('quick:prescriptions', () => {
      void (async () => {
        if (downloadingId) return

        setDownloadingId(document.id)
        try {
          await downloadConsultationDocumentPdf(document, appointment, {
            patientName: user?.name,
          })
        } finally {
          setDownloadingId(null)
        }
      })()
    })
  }

  useAndroidBackHandler(() => {
    if (documentsVisible) {
      closeDocumentsDrawer()
      return true
    }

    if (periodDrawerVisible) {
      setPeriodDrawerVisible(false)
      return true
    }

    if (providerDrawerVisible) {
      setProviderDrawerVisible(false)
      return true
    }

    if (menuVisible) {
      setMenuVisible(false)
      return true
    }

    handleBack()
    return true
  })

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'home') {
      setMenuVisible(false)
      navigateTo('home')
      return
    }

    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    if (tab === 'agendar') {
      setMenuVisible(false)
      navigateTo('schedule-appointment')
      return
    }

    if (tab === 'my-metrics') {
      setMenuVisible(false)
      navigateTo('my-metrics')
      return
    }

    if (tab === 'pos-consulta') {
      setMenuVisible(false)
      navigateTo('post-consultation')
      return
    }

    setMenuVisible(false)
  }

  function handleLogout() {
    setMenuVisible(false)
    void logout()
  }

  const renderSegmentPage = useCallback(
    (tab: MyDocumentsTab) => {
      if (tab === 'by-consultation') {
        return (
          <ScrollView
            style={styles.pageScroll}
            contentContainerStyle={[
              styles.pageContent,
              { paddingBottom: bottomContentPadding },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void loadDocuments(true)}
                tintColor={colors.primaryLight}
              />
            }
          >
            {filteredEntries.length === 0 ? (
              <DocumentsEmptyState
                filtered={anyFilterActive || kindFilter !== 'all'}
                onViewAppointmentsPress={
                  anyFilterActive || kindFilter !== 'all'
                    ? undefined
                    : () => navigateTo('my-appointments')
                }
              />
            ) : (
              <>
                {heroEntry ? (
                  <View style={styles.section}>
                    <ConsultationDocumentsCard
                      entry={heroEntry}
                      featured
                      onPress={() => openDocumentsDrawer(heroEntry.appointment)}
                    />
                  </View>
                ) : null}

                {listEntries.length > 0 && heroEntry ? (
                  <Text style={styles.sectionTitle}>Outras consultas</Text>
                ) : null}

                {listEntries.length > 0 ? (
                  <View style={styles.list}>
                    {listEntries.map((entry) => (
                      <ConsultationDocumentsCard
                        key={entry.appointment.id}
                        entry={entry}
                        onPress={() => openDocumentsDrawer(entry.appointment)}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            )}

            {entries.length > 0 ? <DocumentsDisclaimer /> : null}
          </ScrollView>
        )
      }

      return (
        <ScrollView
          style={styles.pageScroll}
          contentContainerStyle={[
            styles.pageContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadDocuments(true)}
              tintColor={colors.primaryLight}
            />
          }
        >
          <DocumentsKindFilterChips
            activeFilter={kindFilter}
            counts={kindCounts}
            onChange={setKindFilter}
          />

          {flatDocuments.length === 0 ? (
            <DocumentsEmptyState
              filtered={anyFilterActive || kindFilter !== 'all'}
              onViewAppointmentsPress={
                anyFilterActive || kindFilter !== 'all'
                  ? undefined
                  : () => navigateTo('my-appointments')
              }
            />
          ) : (
            <View style={styles.list}>
              {flatDocuments.map((item) => (
                <DocumentFlatRow
                  key={item.document.id}
                  item={item}
                  downloading={downloadingId === item.document.id}
                  onDownload={() =>
                    void handleDownloadFlatDocument(item.document, item.appointment)
                  }
                />
              ))}
            </View>
          )}

          {entries.length > 0 ? <DocumentsDisclaimer /> : null}
        </ScrollView>
      )
    },
    [
      anyFilterActive,
      bottomContentPadding,
      downloadingId,
      entries.length,
      filteredEntries.length,
      flatDocuments,
      handleDownloadFlatDocument,
      heroEntry,
      isRefreshing,
      kindCounts,
      kindFilter,
      listEntries,
      loadDocuments,
      navigateTo,
    ],
  )

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
          title="Atestados e +"
          subtitle="Receitas · Exames · Atestados"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <View style={styles.body}>
          {showSkeleton ? (
            <ScrollView
              contentContainerStyle={[
                styles.skeletonBlock,
                { paddingBottom: bottomContentPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <SkeletonBone width="100%" height={46} borderRadius={14} />
              <SkeletonBone width="100%" height={160} borderRadius={18} />
              <SkeletonBone width="100%" height={120} borderRadius={18} />
            </ScrollView>
          ) : (
            <>
              <DocumentsSegmentTabs
                activeTab={segmentTab}
                consultationCount={filteredEntries.length}
                documentCount={flattenDocumentEntries(filteredEntries).length}
                onChange={handleSegmentTabChange}
              />

              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleCol}>
                  <Text style={styles.sectionTitleText}>
                    {segmentTab === 'by-consultation'
                      ? 'Consultas com documentos'
                      : 'Todos os documentos'}
                  </Text>
                  {periodFilterActive ? (
                    <Text style={styles.sectionPeriod}>{formatPeriodLabel(period)}</Text>
                  ) : null}
                  {providerFilterActive && providerFilter ? (
                    <Text style={styles.sectionProvider}>
                      {formatProviderFilterLabel(providerFilter)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.sectionActions}>
                  {anyFilterActive ? (
                    <Pressable
                      onPress={clearFilters}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.clearFilterButton,
                        pressed && styles.clearFilterButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Limpar filtros"
                    >
                      <Text style={styles.clearFilterText}>Limpar</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={() => setProviderDrawerVisible(true)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.filterIconButton,
                      providerFilterActive && styles.filterIconButtonActive,
                      pressed && styles.filterIconButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Filtrar por médico ou especialidade"
                  >
                    <Ionicons
                      name="search-outline"
                      size={19}
                      color={providerFilterActive ? '#e9d5ff' : colors.textMuted}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => setPeriodDrawerVisible(true)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.filterIconButton,
                      periodFilterActive && styles.filterIconButtonActive,
                      pressed && styles.filterIconButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Filtrar por data da consulta"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={periodFilterActive ? '#e9d5ff' : colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <FlatList
                ref={segmentPagerRef}
                data={DOCUMENTS_SEGMENT_PAGES}
                keyExtractor={(item) => item}
                horizontal
                pagingEnabled
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
                  <View style={[styles.segmentPage, { width: screenWidth }]}>
                    {renderSegmentPage(item)}
                  </View>
                )}
              />
            </>
          )}
        </View>

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />
      </View>

      <AppointmentDocumentsDrawer
        visible={documentsVisible}
        appointment={documentsTarget}
        patientName={user?.name}
        onClose={closeDocumentsDrawer}
      />

      <DocumentsProviderFilterDrawer
        visible={providerDrawerVisible}
        options={providerOptions}
        selectedProvider={providerFilter}
        onClose={() => setProviderDrawerVisible(false)}
        onSelect={setProviderFilter}
      />

      <MetricsPeriodDrawer
        visible={periodDrawerVisible}
        period={periodDraft}
        title="Data da consulta"
        subtitle="Dias com ponto roxo indicam consultas com documentos disponíveis"
        markedDateKeys={consultationDateKeys}
        onClose={() => setPeriodDrawerVisible(false)}
        onApply={setPeriod}
      />

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={handleLogout}
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
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    gap: 14,
    paddingTop: 4,
  },
  skeletonBlock: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionTitleCol: {
    flex: 1,
    gap: 2,
  },
  sectionTitleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionPeriod: {
    color: '#e9d5ff',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionProvider: {
    color: '#e9d5ff',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconButton: {
    padding: 2,
  },
  filterIconButtonActive: {
    opacity: 1,
  },
  filterIconButtonPressed: {
    opacity: 0.55,
  },
  clearFilterButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  clearFilterButtonPressed: {
    opacity: 0.7,
  },
  clearFilterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  section: {
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
})

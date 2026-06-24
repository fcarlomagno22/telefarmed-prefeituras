import * as Haptics from 'expo-haptics'
import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { getEmotionalScreeningInstrument } from '../../config/emotionalScreening/instruments'
import { saveEmotionalScreeningSession } from '../../data/emotionalScreeningStorage'
import type {
  EmotionalScreeningAnswers,
  EmotionalScreeningComputedResult,
  EmotionalScreeningInstrument,
  EmotionalScreeningInstrumentId,
  EmotionalScreeningSessionRecord,
  EmotionalScreeningTab,
} from '../../types/emotionalScreening'
import { computeEmotionalScreeningResult } from '../../utils/emotionalScreeningScoring'
import { RunWalkSegmentTabs, type RunWalkSegmentTabItem } from '../runWalk/RunWalkSegmentTabs'
import { EmotionalScreeningCrisisDrawer } from './EmotionalScreeningCrisisDrawer'
import { EmotionalScreeningHistoryTab } from './EmotionalScreeningHistoryTab'
import { EmotionalScreeningIntroDrawer } from './EmotionalScreeningIntroDrawer'
import { EmotionalScreeningResultDrawer } from './EmotionalScreeningResultDrawer'
import { EmotionalScreeningSessionDrawer } from './EmotionalScreeningSessionDrawer'
import { EmotionalScreeningTestsTab } from './EmotionalScreeningTestsTab'
import { TdahTodInfantilFlow } from '../tdahTodInfantil/TdahTodInfantilFlow'
import { TdahTodInfantilResultDrawer } from '../tdahTodInfantil/TdahTodInfantilResultDrawer'
import type { EmotionalScreeningHistoryItem } from './emotionalScreeningHistoryTypes'
import type { TdahTodEngineResult } from '../../tdahTodInfantil/types'

const SEGMENT_PAGES: EmotionalScreeningTab[] = ['tests', 'history']

const EMOTIONAL_SCREENING_TABS: RunWalkSegmentTabItem<EmotionalScreeningTab>[] = [
  { id: 'tests', label: 'Triagens', available: true },
  { id: 'history', label: 'Histórico', available: true },
]

type EmotionalScreeningHomeContentProps = {
  bottomPadding: number
  patientCpf: string
  refreshKey: number
  onRefresh: () => void
  requireAuth?: (action: () => void) => void
}

function createSessionId() {
  return `es_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function EmotionalScreeningHomeContent({
  bottomPadding,
  patientCpf,
  refreshKey,
  onRefresh,
  requireAuth,
}: EmotionalScreeningHomeContentProps) {
  const { width: screenWidth } = useWindowDimensions()
  const [segmentTab, setSegmentTab] = useState<EmotionalScreeningTab>('tests')
  const [selectedInstrument, setSelectedInstrument] = useState<EmotionalScreeningInstrument | null>(
    null,
  )
  const [introVisible, setIntroVisible] = useState(false)
  const [sessionVisible, setSessionVisible] = useState(false)
  const [resultVisible, setResultVisible] = useState(false)
  const [crisisVisible, setCrisisVisible] = useState(false)
  const [activeResult, setActiveResult] = useState<EmotionalScreeningComputedResult | null>(null)
  const [crisisMessage, setCrisisMessage] = useState<string | undefined>(undefined)
  const [tdahTodFlowVisible, setTdahTodFlowVisible] = useState(false)
  const [tdahTodResultVisible, setTdahTodResultVisible] = useState(false)
  const [activeTdahTodResult, setActiveTdahTodResult] = useState<TdahTodEngineResult | null>(null)

  const segmentPagerRef = useRef<FlatList<EmotionalScreeningTab>>(null)
  const segmentPagerIndexRef = useRef(0)

  function handleSegmentTabChange(tab: EmotionalScreeningTab) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSegmentTab(tab)
    const index = SEGMENT_PAGES.indexOf(tab)
    if (index < 0) return
    segmentPagerIndexRef.current = index
    segmentPagerRef.current?.scrollToIndex({ index, animated: true })
  }

  function handleSegmentPagerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
    if (index === segmentPagerIndexRef.current) return
    segmentPagerIndexRef.current = index
    const nextTab = SEGMENT_PAGES[index]
    if (nextTab) setSegmentTab(nextTab)
  }

  const handleSelectInstrument = useCallback((instrumentId: EmotionalScreeningInstrumentId) => {
    const start = () => {
      if (instrumentId === 'snap-iv') {
        setTdahTodFlowVisible(true)
        return
      }
      const instrument = getEmotionalScreeningInstrument(instrumentId)
      if (!instrument) return
      setSelectedInstrument(instrument)
      setIntroVisible(true)
    }
    if (requireAuth) {
      requireAuth(start)
      return
    }
    start()
  }, [requireAuth])

  async function handleCompleteSession(answers: EmotionalScreeningAnswers) {
    if (!selectedInstrument) return

    const result = computeEmotionalScreeningResult(selectedInstrument.id, answers)
    const session: EmotionalScreeningSessionRecord = {
      id: createSessionId(),
      instrumentId: selectedInstrument.id,
      instrumentTitle: selectedInstrument.title,
      completedAt: new Date().toISOString(),
      answers,
      result,
    }

    await saveEmotionalScreeningSession(patientCpf, session)
    setSessionVisible(false)
    setActiveResult(result)
    onRefresh()

    if (result.safetyTriggered) {
      setCrisisMessage(result.safetyMessage)
      setCrisisVisible(true)
    } else {
      setResultVisible(true)
    }
  }

  function handleOpenHistorySession(item: EmotionalScreeningHistoryItem) {
    if (item.kind === 'tdah-tod') {
      setActiveTdahTodResult(item.session.result)
      setTdahTodResultVisible(true)
      return
    }

    const instrument = getEmotionalScreeningInstrument(item.session.instrumentId)
    if (!instrument) return
    setSelectedInstrument(instrument)
    setActiveResult(item.session.result)
    setResultVisible(true)
  }

  function closeFlows() {
    setIntroVisible(false)
    setSessionVisible(false)
    setResultVisible(false)
    setCrisisVisible(false)
    setSelectedInstrument(null)
    setActiveResult(null)
    setCrisisMessage(undefined)
  }

  return (
    <View style={styles.root}>
      <RunWalkSegmentTabs
        activeTab={segmentTab}
        tabs={EMOTIONAL_SCREENING_TABS}
        onTabChange={handleSegmentTabChange}
      />

      <FlatList
        ref={segmentPagerRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        data={SEGMENT_PAGES}
        keyExtractor={(item) => item}
        onMomentumScrollEnd={handleSegmentPagerScroll}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={{ width: screenWidth }}>
            {item === 'tests' ? (
              <EmotionalScreeningTestsTab
                bottomPadding={bottomPadding}
                onSelectInstrument={handleSelectInstrument}
              />
            ) : (
              <EmotionalScreeningHistoryTab
                bottomPadding={bottomPadding}
                patientCpf={patientCpf}
                refreshKey={refreshKey}
                onOpenSession={handleOpenHistorySession}
              />
            )}
          </View>
        )}
      />

      <EmotionalScreeningIntroDrawer
        visible={introVisible}
        instrument={selectedInstrument}
        onClose={() => setIntroVisible(false)}
        onStart={() => {
          setIntroVisible(false)
          setSessionVisible(true)
        }}
      />

      <EmotionalScreeningSessionDrawer
        visible={sessionVisible}
        instrument={selectedInstrument}
        onClose={() => setSessionVisible(false)}
        onComplete={(answers) => {
          void handleCompleteSession(answers)
        }}
      />

      <EmotionalScreeningResultDrawer
        visible={resultVisible}
        instrument={selectedInstrument}
        result={activeResult}
        onClose={closeFlows}
      />

      <EmotionalScreeningCrisisDrawer
        visible={crisisVisible}
        message={crisisMessage}
        onClose={() => {
          setCrisisVisible(false)
          setResultVisible(true)
        }}
      />

      <TdahTodInfantilFlow
        visible={tdahTodFlowVisible}
        patientCpf={patientCpf}
        onClose={() => setTdahTodFlowVisible(false)}
        onCompleted={() => {
          onRefresh()
        }}
      />

      <TdahTodInfantilResultDrawer
        visible={tdahTodResultVisible}
        result={activeTdahTodResult}
        onClose={() => {
          setTdahTodResultVisible(false)
          setActiveTdahTodResult(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})

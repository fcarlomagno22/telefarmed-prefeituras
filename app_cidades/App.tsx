import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { useCallback, useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { GuestAuthProvider } from './src/contexts/GuestAuthContext'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { useAndroidBackHandler } from './src/hooks/useAndroidBackHandler'
import { useAndroidNavigationBar } from './src/hooks/useAndroidNavigationBar'
import { colors } from './src/theme/colors'
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { MyAppointmentsScreen } from './src/screens/MyAppointmentsScreen'
import { MyDocumentsScreen } from './src/screens/MyDocumentsScreen'
import { MyMetricsScreen } from './src/screens/MyMetricsScreen'
import { PostConsultationScreen } from './src/screens/PostConsultationScreen'
import { NearbyUnitsScreen } from './src/screens/NearbyUnitsScreen'
import { NearbyRunningRoutesScreen } from './src/screens/NearbyRunningRoutesScreen'
import { FunctionalTrainingScreen } from './src/screens/FunctionalTrainingScreen'
import { FunctionalExerciseScreen } from './src/screens/FunctionalExerciseScreen'
import { EatWellScreen } from './src/screens/EatWellScreen'
import { SleepStoriesScreen } from './src/screens/SleepStoriesScreen'
import { SleepTimeScreen } from './src/screens/SleepTimeScreen'
import { MentalHealthScreen } from './src/screens/MentalHealthScreen'
import { MyRoutineScreen } from './src/screens/MyRoutineScreen'
import { ActiveMindScreen } from './src/screens/ActiveMindScreen'
import { ActiveMindDifficultyScreen } from './src/screens/ActiveMindDifficultyScreen'
import { ActiveMindSudokuScreen } from './src/screens/ActiveMindSudokuScreen'
import { ActiveMindCrosswordsScreen } from './src/screens/ActiveMindCrosswordsScreen'
import { ActiveMindWordSearchScreen } from './src/screens/ActiveMindWordSearchScreen'
import { ActiveMindFormTheWordScreen } from './src/screens/ActiveMindFormTheWordScreen'
import { ActiveMindCalculationsScreen } from './src/screens/ActiveMindCalculationsScreen'
import { ActiveMindLogicSequenceScreen } from './src/screens/ActiveMindLogicSequenceScreen'
import { BibleScreen } from './src/screens/BibleScreen'
import { BibleChaptersScreen } from './src/screens/BibleChaptersScreen'
import { BibleChapterVersesScreen } from './src/screens/BibleChapterVersesScreen'
import { BiblePeaceWordsTopicScreen } from './src/screens/BiblePeaceWordsTopicScreen'
import { EatWellMenuDetailScreen } from './src/screens/EatWellMenuDetailScreen'
import { RunWalkScreen } from './src/screens/RunWalkScreen'
import { RunWalkPreparationChecklistScreen } from './src/screens/RunWalkPreparationChecklistScreen'
import { RunWalkPreparationScreen } from './src/screens/RunWalkPreparationScreen'
import { RunWalkStartCountdownScreen } from './src/screens/RunWalkStartCountdownScreen'
import { RunWalkLiveLocationViewerScreen } from './src/screens/RunWalkLiveLocationViewerScreen'
import { RunWalkLiveActivityScreen } from './src/screens/RunWalkLiveActivityScreen'
import { RunWalkAchievementDetailScreen } from './src/screens/RunWalkAchievementDetailScreen'
import { RunWalkAchievementsScreen } from './src/screens/RunWalkAchievementsScreen'
import { RunWalkChallengeRulesScreen } from './src/screens/RunWalkChallengeRulesScreen'
import { RunWalkChallengesScreen } from './src/screens/RunWalkChallengesScreen'
import { RunWalkActivityCheckInScreen } from './src/screens/RunWalkActivityCheckInScreen'
import { RunWalkActivitySummaryScreen } from './src/screens/RunWalkActivitySummaryScreen'
import { ScheduleAppointmentScreen } from './src/screens/ScheduleAppointmentScreen'
import { LoginScreen } from './src/screens/LoginScreen'
import { RegisterScreen } from './src/screens/RegisterScreen'

function AppRouter() {
  const { screen, goBack, canGoBack } = useAuth()

  useAndroidBackHandler(
    useCallback(() => {
      if (canGoBack()) {
        return goBack()
      }
      return false
    }, [canGoBack, goBack]),
  )

  if (screen === 'register') return <RegisterScreen />
  if (screen === 'forgot-password') return <ForgotPasswordScreen />
  if (screen === 'my-documents') return <MyDocumentsScreen />
  if (screen === 'my-metrics') return <MyMetricsScreen />
  if (screen === 'my-appointments') return <MyAppointmentsScreen />
  if (screen === 'post-consultation') return <PostConsultationScreen />
  if (screen === 'nearby-units') return <NearbyUnitsScreen />
  if (screen === 'nearby-running-routes') return <NearbyRunningRoutesScreen />
  if (screen === 'functional-training') return <FunctionalTrainingScreen />
  if (screen === 'functional-exercise') return <FunctionalExerciseScreen />
  if (screen === 'run-walk') return <RunWalkScreen />
  if (screen === 'run-walk-preparation') return <RunWalkPreparationScreen />
  if (screen === 'run-walk-checklist') return <RunWalkPreparationChecklistScreen />
  if (screen === 'run-walk-countdown') return <RunWalkStartCountdownScreen />
  if (screen === 'run-walk-live') return <RunWalkLiveActivityScreen />
  if (screen === 'run-walk-live-viewer') return <RunWalkLiveLocationViewerScreen />
  if (screen === 'run-walk-checkin') return <RunWalkActivityCheckInScreen />
  if (screen === 'run-walk-challenges') return <RunWalkChallengesScreen />
  if (screen === 'run-walk-challenge-rules') return <RunWalkChallengeRulesScreen />
  if (screen === 'run-walk-achievements') return <RunWalkAchievementsScreen />
  if (screen === 'run-walk-achievement-detail') return <RunWalkAchievementDetailScreen />
  if (screen === 'run-walk-summary') return <RunWalkActivitySummaryScreen />
  if (screen === 'eat-well') return <EatWellScreen />
  if (screen === 'eat-well-menu') return <EatWellMenuDetailScreen />
  if (screen === 'sleep-time') return <SleepTimeScreen />
  if (screen === 'sleep-stories') return <SleepStoriesScreen />
  if (screen === 'mental-health') return <MentalHealthScreen />
  if (screen === 'my-routine') return <MyRoutineScreen />
  if (screen === 'active-mind') return <ActiveMindScreen />
  if (screen === 'active-mind-difficulty') return <ActiveMindDifficultyScreen />
  if (screen === 'active-mind-sudoku') return <ActiveMindSudokuScreen />
  if (screen === 'active-mind-form-the-word') return <ActiveMindFormTheWordScreen />
  if (screen === 'active-mind-crosswords') return <ActiveMindCrosswordsScreen />
  if (screen === 'active-mind-word-search') return <ActiveMindWordSearchScreen />
  if (screen === 'active-mind-calculations') return <ActiveMindCalculationsScreen />
  if (screen === 'active-mind-logic-sequence') return <ActiveMindLogicSequenceScreen />
  if (screen === 'bible') return <BibleScreen />
  if (screen === 'bible-chapters') return <BibleChaptersScreen />
  if (screen === 'bible-chapter-verses') return <BibleChapterVersesScreen />
  if (screen === 'bible-peace-words-topic') return <BiblePeaceWordsTopicScreen />
  if (screen === 'schedule-appointment') return <ScheduleAppointmentScreen />
  if (screen === 'home') return <HomeScreen />
  return <LoginScreen />
}

export default function App() {
  useAndroidNavigationBar()

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <GuestAuthProvider>
            <ThemeProvider>
              <StatusBar style="light" translucent backgroundColor="transparent" />
              <AppRouter />
            </ThemeProvider>
          </GuestAuthProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

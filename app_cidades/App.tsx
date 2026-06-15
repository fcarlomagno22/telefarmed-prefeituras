import { StatusBar } from 'expo-status-bar'
import { useCallback } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { useAndroidBackHandler } from './src/hooks/useAndroidBackHandler'
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { MyAppointmentsScreen } from './src/screens/MyAppointmentsScreen'
import { MyDocumentsScreen } from './src/screens/MyDocumentsScreen'
import { MyMetricsScreen } from './src/screens/MyMetricsScreen'
import { PostConsultationScreen } from './src/screens/PostConsultationScreen'
import { NearbyUnitsScreen } from './src/screens/NearbyUnitsScreen'
import { FunctionalTrainingScreen } from './src/screens/FunctionalTrainingScreen'
import { FunctionalExerciseScreen } from './src/screens/FunctionalExerciseScreen'
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
  if (screen === 'functional-training') return <FunctionalTrainingScreen />
  if (screen === 'functional-exercise') return <FunctionalExerciseScreen />
  if (screen === 'schedule-appointment') return <ScheduleAppointmentScreen />
  if (screen === 'home') return <HomeScreen />
  return <LoginScreen />
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppRouter />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

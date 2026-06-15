import { StatusBar } from 'expo-status-bar'
import { useCallback } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { useAndroidBackHandler } from './src/hooks/useAndroidBackHandler'
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { MyAppointmentsScreen } from './src/screens/MyAppointmentsScreen'
import { MyMetricsScreen } from './src/screens/MyMetricsScreen'
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
  if (screen === 'my-metrics') return <MyMetricsScreen />
  if (screen === 'my-appointments') return <MyAppointmentsScreen />
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

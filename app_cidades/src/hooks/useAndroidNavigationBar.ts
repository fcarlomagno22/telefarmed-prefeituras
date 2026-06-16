import * as NavigationBar from 'expo-navigation-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { colors } from '../theme/colors'

const NAV_BAR_COLOR = colors.background

export function applyAndroidNavigationBar() {
  if (Platform.OS !== 'android') return

  void SystemUI.setBackgroundColorAsync(NAV_BAR_COLOR)
  void NavigationBar.setStyle('light')
}

export function useAndroidNavigationBar() {
  useEffect(() => {
    applyAndroidNavigationBar()
  }, [])
}

import * as NavigationBar from 'expo-navigation-bar'
import { useEffect } from 'react'
import { Platform } from 'react-native'

export const TRANSPARENT_NAV_BAR = '#00000000'

/** Navigation bar translúcida sobre o conteúdo — não altera insets/padding dos drawers. */
export function applyAndroidNavigationBar() {
  if (Platform.OS !== 'android') return

  void NavigationBar.setPositionAsync('absolute')
  void NavigationBar.setBackgroundColorAsync(TRANSPARENT_NAV_BAR)
  void NavigationBar.setButtonStyleAsync('light')
}

/** Reaplica a nav bar transparente enquanto um modal/drawer está aberto (Android pode resetar no build). */
export function applyAndroidNavigationBarForModal() {
  applyAndroidNavigationBar()
}

export function useAndroidNavigationBar() {
  useEffect(() => {
    applyAndroidNavigationBar()
  }, [])
}

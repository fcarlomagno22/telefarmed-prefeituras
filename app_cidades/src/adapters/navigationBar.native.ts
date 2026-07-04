import * as NavigationBar from 'expo-navigation-bar'
import { Platform } from 'react-native'
import type { NavigationBarButtonStyle } from './navigationBar.types'

export async function setNavigationBarBackgroundColorAsync(color: string): Promise<void> {
  if (Platform.OS !== 'android') return

  await NavigationBar.setBackgroundColorAsync(color)
}

export async function setNavigationBarButtonStyleAsync(
  style: NavigationBarButtonStyle,
): Promise<void> {
  if (Platform.OS !== 'android') return

  await NavigationBar.setButtonStyleAsync(style)
}

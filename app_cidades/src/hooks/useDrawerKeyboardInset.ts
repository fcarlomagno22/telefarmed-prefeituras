import { useEffect, useState } from 'react'
import { Keyboard, Platform, type KeyboardEvent } from 'react-native'

export const DRAWER_KEYBOARD_EXTRA_PADDING = 20

export function useDrawerKeyboardInset(visible: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0)

  useEffect(() => {
    if (!visible) {
      setKeyboardInset(0)
      return
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    function handleKeyboardShow(event: KeyboardEvent) {
      setKeyboardInset(event.endCoordinates.height)
    }

    function handleKeyboardHide() {
      setKeyboardInset(0)
    }

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow)
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [visible])

  return keyboardInset
}

export function getDrawerKeyboardLift(
  keyboardInset: number,
  bottomInset: number,
  extra = DRAWER_KEYBOARD_EXTRA_PADDING,
) {
  if (keyboardInset <= 0) return 0
  return Math.max(0, keyboardInset - Math.max(bottomInset, 0) + extra)
}

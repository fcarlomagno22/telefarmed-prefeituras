import { Platform } from 'react-native'

export const keyboardAvoidingBehavior = Platform.select<'padding' | 'height' | undefined>({
  ios: 'padding',
  android: 'height',
  default: undefined,
})

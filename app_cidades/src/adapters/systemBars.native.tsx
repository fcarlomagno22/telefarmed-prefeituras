import { SystemBars } from 'react-native-edge-to-edge'
import type { AppSystemBarsProps } from './systemBars.types'

export function AppSystemBars({ style = 'auto' }: AppSystemBarsProps) {
  return <SystemBars style={style} />
}

import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { TdahTodEngineResult } from '../../tdahTodInfantil/types'
import { colors } from '../../theme/colors'
import { AppModal } from '../AppModal'
import { TdahTodInfantilResultView } from './TdahTodInfantilResultView'

type TdahTodInfantilResultDrawerProps = {
  visible: boolean
  result: TdahTodEngineResult | null
  onClose: () => void
}

export function TdahTodInfantilResultDrawer({
  visible,
  result,
  onClose,
}: TdahTodInfantilResultDrawerProps) {
  const insets = useSafeAreaInsets()

  if (!result) return null

  return (
    <AppModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      navBarUnderlayColor={colors.background}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TdahTodInfantilResultView result={result} onClose={onClose} />
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

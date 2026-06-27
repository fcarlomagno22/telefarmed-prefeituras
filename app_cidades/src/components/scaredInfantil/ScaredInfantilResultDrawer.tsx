import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ScaredEngineResult } from '../../scaredInfantil/types'
import { colors } from '../../theme/colors'
import { AppModal } from '../AppModal'
import { ScaredInfantilResultView } from './ScaredInfantilResultView'

type ScaredInfantilResultDrawerProps = {
  visible: boolean
  result: ScaredEngineResult | null
  onClose: () => void
}

export function ScaredInfantilResultDrawer({
  visible,
  result,
  onClose,
}: ScaredInfantilResultDrawerProps) {
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
        <ScaredInfantilResultView result={result} onClose={onClose} />
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

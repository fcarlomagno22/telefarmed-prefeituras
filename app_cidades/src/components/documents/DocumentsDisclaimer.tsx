import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

export function DocumentsDisclaimer() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        Documentos digitais assinados pelo médico durante a consulta. Baixe em PDF quando
        precisar.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  text: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
})

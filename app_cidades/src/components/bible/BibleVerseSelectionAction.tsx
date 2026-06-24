import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type BibleVerseSelectionActionProps = {
  selectedText: string
  onHighlight: () => void
  onDismiss: () => void
}

export function BibleVerseSelectionAction({
  selectedText,
  onHighlight,
  onDismiss,
}: BibleVerseSelectionActionProps) {
  const preview =
    selectedText.length > 56 ? `${selectedText.slice(0, 56).trim()}…` : selectedText.trim()

  return (
    <View style={styles.wrap}>
      <View style={styles.previewRow}>
        <Ionicons name="text" size={14} color="#fbbf24" />
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onDismiss()
          }}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            onHighlight()
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Ionicons name="color-fill-outline" size={16} color="#1a1208" />
          <Text style={styles.primaryButtonText}>Grifar</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  preview: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fbbf24',
  },
  primaryButtonText: {
    color: '#1a1208',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.86,
  },
})

import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ScaredConsentItem } from '../../scaredInfantil/types'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type ScaredConsentTermDrawerProps = {
  visible: boolean
  item: ScaredConsentItem | null
  accepted: boolean
  onClose: () => void
  onAcceptChange: (accepted: boolean) => void
}

export function ScaredConsentTermDrawer({
  visible,
  item,
  accepted,
  onClose,
  onAcceptChange,
}: ScaredConsentTermDrawerProps) {
  if (!item) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={item.label}
      subtitle={item.required ? 'Termo obrigatório' : 'Termo opcional'}
      onClose={onClose}
      footer={
        accepted ? (
          <View style={styles.footerActions}>
            {item.required ? (
              <PrimaryButton label="Fechar" onPress={onClose} />
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    onAcceptChange(false)
                    onClose()
                  }}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryBtnText}>Remover autorização</Text>
                </Pressable>
                <PrimaryButton label="Fechar" onPress={onClose} />
              </>
            )}
          </View>
        ) : (
          <PrimaryButton
            label={item.acceptanceLabel}
            onPress={() => {
              onAcceptChange(true)
              onClose()
            }}
          />
        )
      }
    >
      <View style={styles.content}>
        {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
        <Text style={styles.fullText}>{item.fullText}</Text>
        {accepted ? (
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedBadgeText}>Aceito</Text>
          </View>
        ) : null}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 8,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  fullText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  acceptedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.35)',
  },
  acceptedBadgeText: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  footerActions: {
    gap: 10,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
})

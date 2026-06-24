import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MENU_HELP_TOPICS } from '../../config/menuHelpContent'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MenuHelpDrawerProps = {
  visible: boolean
  onClose: () => void
}

export function MenuHelpDrawer({ visible, onClose }: MenuHelpDrawerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleTopic(id: string) {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Central de ajuda"
      subtitle="Perguntas frequentes sobre o app"
      onClose={onClose}
      fullScreen
    >
      <Text style={styles.intro}>
        Encontre respostas rápidas sobre consultas, métricas, rotina e outras funcionalidades. Se
        não resolver, fale com o suporte pelo menu.
      </Text>

      {MENU_HELP_TOPICS.map((topic) => {
        const isExpanded = expandedId === topic.id

        return (
          <View key={topic.id} style={styles.topicWrap}>
            <Pressable
              onPress={() => toggleTopic(topic.id)}
              style={({ pressed }) => [styles.topicHeader, pressed && styles.topicHeaderPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              accessibilityLabel={topic.question}
            >
              <Text style={styles.topicQuestion}>{topic.question}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSubtle}
              />
            </Pressable>

            {isExpanded ? <Text style={styles.topicAnswer}>{topic.answer}</Text> : null}
          </View>
        )
      })}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 8,
  },
  topicWrap: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
  },
  topicHeaderPressed: {
    opacity: 0.72,
  },
  topicQuestion: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topicAnswer: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    paddingBottom: 14,
  },
})

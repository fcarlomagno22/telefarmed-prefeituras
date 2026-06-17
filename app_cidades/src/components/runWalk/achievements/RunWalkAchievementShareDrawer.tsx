import { LinearGradient } from 'expo-linear-gradient'
import { Share, StyleSheet, Text, View } from 'react-native'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import type { RunWalkAchievement } from '../../../types/runWalkAchievements'
import { RunWalkAchievementMedalMark } from './RunWalkAchievementMedalMark'

type RunWalkAchievementShareDrawerProps = {
  visible: boolean
  achievement: RunWalkAchievement | null
  userName: string
  onClose: () => void
}

function formatAchievementDate(isoDate: string | null) {
  if (!isoDate) return '—'

  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function RunWalkAchievementShareDrawer({
  visible,
  achievement,
  userName,
  onClose,
}: RunWalkAchievementShareDrawerProps) {
  if (!achievement) return null

  const shareMessage = [
    '🏅 Conquista desbloqueada no Telefarmed!',
    '',
    achievement.title,
    achievement.unlockedAt ? `Conquistada em ${formatAchievementDate(achievement.unlockedAt)}` : '',
    '',
    achievement.meaning,
    '',
    'Continue se movimentando com a gente.',
  ]
    .filter(Boolean)
    .join('\n')

  async function handleShare() {
    await Share.share({ message: shareMessage })
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Card comemorativo"
      subtitle="Compartilhe sua conquista"
      onClose={onClose}
      footer={<PrimaryButton label="Compartilhar conquista" onPress={() => void handleShare()} />}
    >
      <View style={styles.previewWrap}>
        <LinearGradient
          colors={[`${achievement.accentColor}40`, '#101018', '#0a0a0c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <Text style={styles.previewBrand}>Telefarmed</Text>
          <RunWalkAchievementMedalMark
            accentColor={achievement.accentColor}
            icon={achievement.icon}
            size="xl"
            showGlow
          />
          <Text style={styles.previewTitle}>{achievement.title}</Text>
          <Text style={styles.previewUser}>{userName}</Text>
          <Text style={styles.previewDate}>
            {formatAchievementDate(achievement.unlockedAt)}
          </Text>
          <Text style={styles.previewMeaning}>{achievement.meaning}</Text>
        </LinearGradient>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  previewWrap: {
    paddingTop: 4,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  previewBrand: {
    color: 'rgba(245, 245, 247, 0.72)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  previewUser: {
    color: 'rgba(245, 245, 247, 0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  previewDate: {
    color: 'rgba(245, 245, 247, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  previewMeaning: {
    color: 'rgba(245, 245, 247, 0.72)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '500',
  },
})

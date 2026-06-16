import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  getInstalledMusicApps,
  openMusicApp,
  type MusicAppOption,
} from '../../../utils/runWalkMusicApps'
import { colors } from '../../../theme/colors'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'

type RunWalkMusicAppsDrawerProps = {
  visible: boolean
  onClose: () => void
  onAppOpened: () => void
}

function MusicAppIcon({ app }: { app: MusicAppOption }) {
  const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
    app.icon === 'spotify'
      ? 'spotify'
      : app.icon === 'youtube'
        ? 'youtube'
        : 'music'

  return <MaterialCommunityIcons name={iconName} size={22} color="#fff" />
}

export function RunWalkMusicAppsDrawer({
  visible,
  onClose,
  onAppOpened,
}: RunWalkMusicAppsDrawerProps) {
  const [apps, setApps] = useState<MusicAppOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setApps([])
      setLoadError(null)
      setIsLoading(false)
      return
    }

    let active = true

    async function loadInstalledApps() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const installed = await getInstalledMusicApps()
        if (!active) return
        setApps(installed)
      } catch {
        if (!active) return
        setLoadError('Não foi possível verificar os apps instalados.')
        setApps([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadInstalledApps()
    return () => {
      active = false
    }
  }, [visible])

  async function handleOpen(app: MusicAppOption) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await openMusicApp(app)
      onAppOpened()
      onClose()
    } catch {
      setLoadError(`Não foi possível abrir o ${app.name}.`)
    }
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Selecionar música"
      subtitle="Mostramos apenas apps de música instalados no celular. Você pode retornar sem selecionar nada."
      onClose={onClose}
    >
      <View style={styles.list}>
        {isLoading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={colors.primaryLight} />
            <Text style={styles.stateText}>Verificando apps instalados...</Text>
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View style={styles.stateWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        {!isLoading && !loadError && apps.length === 0 ? (
          <View style={styles.stateWrap}>
            <MaterialCommunityIcons name="music-off" size={28} color={colors.textSubtle} />
            <Text style={styles.stateTitle}>Nenhum app encontrado</Text>
            <Text style={styles.stateText}>
              Instale Spotify, YouTube Music, Deezer ou outro app compatível para ouvir música
              durante a atividade.
            </Text>
          </View>
        ) : null}

        {!isLoading
          ? apps.map((app) => (
              <Pressable
                key={app.id}
                onPress={() => void handleOpen(app)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${app.name}`}
              >
                <LinearGradient
                  colors={['rgba(255, 133, 51, 0.85)', 'rgba(255, 107, 0, 0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <MusicAppIcon app={app} />
                </LinearGradient>
                <Text style={styles.name}>{app.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSubtle} />
              </Pressable>
            ))
          : null}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  stateWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
})

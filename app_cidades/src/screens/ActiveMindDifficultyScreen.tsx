import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useMemo, useState } from 'react'
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActionToast } from '../components/ActionToast'
import { ActiveMindDifficultyOption } from '../components/activeMind/ActiveMindDifficultyOption'
import { ActiveMindGameIcon } from '../components/activeMind/ActiveMindGameIcon'
import { CrosswordHowToPlayDrawer } from '../components/activeMind/crosswords/CrosswordHowToPlayDrawer'
import { CrosswordIntroCard } from '../components/activeMind/crosswords/CrosswordIntroCard'
import { WordSearchHowToPlayDrawer } from '../components/activeMind/wordSearch/WordSearchHowToPlayDrawer'
import { WordSearchIntroCard } from '../components/activeMind/wordSearch/WordSearchIntroCard'
import { FormTheWordHowToPlayDrawer } from '../components/activeMind/formTheWord/FormTheWordHowToPlayDrawer'
import { FormTheWordIntroCard } from '../components/activeMind/formTheWord/FormTheWordIntroCard'
import { CalculationsHowToPlayDrawer } from '../components/activeMind/calculations/CalculationsHowToPlayDrawer'
import { CalculationsIntroCard } from '../components/activeMind/calculations/CalculationsIntroCard'
import { LogicSequenceHowToPlayDrawer } from '../components/activeMind/logicSequence/LogicSequenceHowToPlayDrawer'
import { LogicSequenceIntroCard } from '../components/activeMind/logicSequence/LogicSequenceIntroCard'
import { SudokuHowToPlayDrawer } from '../components/activeMind/sudoku/SudokuHowToPlayDrawer'
import { SudokuIntroCard } from '../components/activeMind/sudoku/SudokuIntroCard'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { ACTIVE_MIND_DIFFICULTY_OPTIONS } from '../config/activeMindDifficulty'
import { getActiveMindGameById } from '../config/activeMindGames'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function ActiveMindDifficultyScreen() {
  const insets = useSafeAreaInsets()
  const { user, routeParams, goBack, canGoBack, navigateTo, logout } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)

  const [menuVisible, setMenuVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [howToVisible, setHowToVisible] = useState(false)

  const game = useMemo(
    () => (activeMindParams.gameId ? getActiveMindGameById(activeMindParams.gameId) : undefined),
    [activeMindParams.gameId],
  )

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  useAndroidBackHandler(
    useCallback(() => {
      if (howToVisible) {
        setHowToVisible(false)
        return true
      }

      if (menuVisible) {
        setMenuVisible(false)
        return true
      }

      if (canGoBack()) {
        goBack()
        return true
      }
      return false
    }, [canGoBack, goBack, howToVisible, menuVisible]),
  )

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    setMenuVisible(false)

    if (tab === 'home') navigateTo('home')
    else if (tab === 'my-metrics') navigateTo('my-metrics')
    else if (tab === 'agendar') navigateTo('schedule-appointment')
    else if (tab === 'pos-consulta') navigateTo('post-consultation')
  }

  function handleBack() {
    if (canGoBack()) {
      goBack()
      return
    }
    navigateTo('active-mind')
  }

  function handleDifficultyPress(difficulty: ActiveMindPlayDifficulty) {
    if (!game) return

    if (game.id === 'sudoku') {
      navigateTo('active-mind-sudoku', { gameId: game.id, difficulty })
      return
    }

    if (game.id === 'form-the-word') {
      navigateTo('active-mind-form-the-word', { gameId: game.id, difficulty })
      return
    }

    if (game.id === 'crosswords') {
      navigateTo('active-mind-crosswords', { gameId: game.id, difficulty })
      return
    }

    if (game.id === 'word-search') {
      navigateTo('active-mind-word-search', { gameId: game.id, difficulty })
      return
    }

    if (game.id === 'calculations') {
      navigateTo('active-mind-calculations', { gameId: game.id, difficulty })
      return
    }

    if (game.id === 'logic-sequence') {
      navigateTo('active-mind-logic-sequence', { gameId: game.id, difficulty })
      return
    }

    const label =
      ACTIVE_MIND_DIFFICULTY_OPTIONS.find((option) => option.id === difficulty)?.title ?? difficulty

    setToastMessage(`${game.title} (${label}) estará disponível em breve.`)
  }

  if (!game) {
    return (
      <View style={styles.root}>
        <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
          <LinearGradient
            colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
            style={StyleSheet.absoluteFillObject}
          />
          <ScreenStackHeader
            title="Ativa Mente"
            subtitle="Escolha a dificuldade"
            paddingTop={headerPaddingTop}
            onBack={handleBack}
          />
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Jogo não encontrado.</Text>
          </View>

          <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

          <MenuDrawer
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            userName={user?.name}
            selfieUri={user?.selfieUri}
            onLogoutPress={() => void logout()}
          />
        </ImageBackground>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title={game.title}
          subtitle="Escolha a dificuldade"
          paddingTop={headerPaddingTop}
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {game.id === 'sudoku' ? (
            <SudokuIntroCard game={game} onHowToPlayPress={() => setHowToVisible(true)} />
          ) : game.id === 'form-the-word' ? (
            <FormTheWordIntroCard game={game} onHowToPlayPress={() => setHowToVisible(true)} />
          ) : game.id === 'crosswords' ? (
            <CrosswordIntroCard game={game} onHowToPlayPress={() => setHowToVisible(true)} />
          ) : game.id === 'word-search' ? (
            <WordSearchIntroCard game={game} onHowToPlayPress={() => setHowToVisible(true)} />
          ) : game.id === 'calculations' ? (
            <CalculationsIntroCard game={game} onHowToPlayPress={() => setHowToVisible(true)} />
          ) : game.id === 'logic-sequence' ? (
            <LogicSequenceIntroCard game={game} onHowToPlayPress={() => setHowToVisible(true)} />
          ) : (
            <View style={styles.gameSummary}>
              <View style={[styles.gameIconShadow, { shadowColor: game.shadowColor }]}>
                <LinearGradient
                  colors={[...game.iconGradient]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.gameIcon}
                >
                  <ActiveMindGameIcon icon={game.icon} size={30} color="#fff" />
                </LinearGradient>
              </View>

              <View style={styles.gameSummaryText}>
                <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
                <Text style={styles.gameHint}>Selecione o nível que combina com você hoje.</Text>
              </View>
            </View>
          )}

          <View style={styles.options}>
            {ACTIVE_MIND_DIFFICULTY_OPTIONS.map((option) => (
              <ActiveMindDifficultyOption
                key={option.id}
                difficulty={option.id}
                title={option.title}
                description={option.description}
                gradient={option.gradient}
                shadowColor={option.shadowColor}
                onPress={handleDifficultyPress}
              />
            ))}
          </View>
        </ScrollView>

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

        <MenuDrawer
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          userName={user?.name}
          selfieUri={user?.selfieUri}
          onLogoutPress={() => void logout()}
        />
      </ImageBackground>

      <ActionToast
        message={toastMessage}
        onHidden={() => setToastMessage(null)}
        bottomOffset={bottomContentPadding}
      />

      {game.id === 'sudoku' ? (
        <SudokuHowToPlayDrawer visible={howToVisible} onClose={() => setHowToVisible(false)} />
      ) : game.id === 'form-the-word' ? (
        <FormTheWordHowToPlayDrawer visible={howToVisible} onClose={() => setHowToVisible(false)} />
      ) : game.id === 'crosswords' ? (
        <CrosswordHowToPlayDrawer visible={howToVisible} onClose={() => setHowToVisible(false)} />
      ) : game.id === 'word-search' ? (
        <WordSearchHowToPlayDrawer visible={howToVisible} onClose={() => setHowToVisible(false)} />
      ) : game.id === 'calculations' ? (
        <CalculationsHowToPlayDrawer visible={howToVisible} onClose={() => setHowToVisible(false)} />
      ) : game.id === 'logic-sequence' ? (
        <LogicSequenceHowToPlayDrawer visible={howToVisible} onClose={() => setHowToVisible(false)} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 20,
    paddingTop: 8,
  },
  gameSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  gameIconShadow: {
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameSummaryText: {
    flex: 1,
    gap: 4,
  },
  gameSubtitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  gameHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  options: {
    gap: 12,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
})

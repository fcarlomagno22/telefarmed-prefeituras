import { useEffect, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { hasAppIntroBeenSeen, markAppIntroSeen } from '../../data/appIntroStorage'
import { AppIntroVideoOverlay } from './AppIntroVideoOverlay'

type IntroGateState = 'loading' | 'intro' | 'done'

type AppIntroGateProps = {
  children: ReactNode
}

export function AppIntroGate({ children }: AppIntroGateProps) {
  const [state, setState] = useState<IntroGateState>('loading')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const seen = await hasAppIntroBeenSeen()
      if (cancelled) return
      setState(seen ? 'done' : 'intro')
    })()

    return () => {
      cancelled = true
    }
  }, [])

  function handleIntroComplete() {
    void markAppIntroSeen()
    setState('done')
  }

  if (state === 'loading' || state === 'intro') {
    return (
      <View style={styles.shell}>
        {state === 'intro' ? (
          <AppIntroVideoOverlay onComplete={handleIntroComplete} />
        ) : null}
      </View>
    )
  }

  return <View style={styles.shell}>{children}</View>
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#000',
  },
})

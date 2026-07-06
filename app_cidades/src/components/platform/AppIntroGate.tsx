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

  if (state === 'loading') {
    return <View style={styles.boot} />
  }

  return (
    <View style={styles.root}>
      {children}
      {state === 'intro' ? <AppIntroVideoOverlay onComplete={handleIntroComplete} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  boot: {
    flex: 1,
    backgroundColor: '#000',
  },
})

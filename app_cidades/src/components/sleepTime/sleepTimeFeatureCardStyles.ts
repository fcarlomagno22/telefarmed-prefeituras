import { StyleSheet } from 'react-native'

/** Altura do card "Histórias para dormir" — referência para todos os cards de destaque. */
export const SLEEP_TIME_FEATURE_CARD_HEIGHT = 110

const CONTENT_HEIGHT = 74

export const sleepTimeFeatureCardStyles = StyleSheet.create({
  pressable: {
    marginHorizontal: 16,
    borderRadius: 20,
    height: SLEEP_TIME_FEATURE_CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: CONTENT_HEIGHT,
  },
  textCol: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
})

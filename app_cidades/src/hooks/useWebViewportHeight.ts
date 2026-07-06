import { useWindowDimensions } from 'react-native'

/** Fallback nativo — na web use `useWebViewportHeight.web.ts`. */
export function useWebViewportHeight(): number {
  const { height } = useWindowDimensions()
  return height
}

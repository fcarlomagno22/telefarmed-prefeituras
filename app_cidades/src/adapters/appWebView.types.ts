import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export type AppWebViewSource =
  | { html: string }
  | { uri: string }

export type WebViewMessageEvent = {
  nativeEvent: {
    data: string
  }
}

export type AppWebViewRef = {
  injectJavaScript: (script: string) => void
}

export type AppWebViewProps = {
  source: AppWebViewSource
  style?: StyleProp<ViewStyle>
  scrollEnabled?: boolean
  bounces?: boolean
  overScrollMode?: 'always' | 'content' | 'never'
  nestedScrollEnabled?: boolean
  javaScriptEnabled?: boolean
  domStorageEnabled?: boolean
  setSupportMultipleWindows?: boolean
  originWhitelist?: string[]
  onMessage?: (event: WebViewMessageEvent) => void
  onLoadEnd?: () => void
  mixedContentMode?: 'always' | 'never' | 'compatibility'
  allowFileAccess?: boolean
  allowUniversalAccessFromFileURLs?: boolean
  startInLoadingState?: boolean
  renderLoading?: () => ReactNode
  allowsBackForwardNavigationGestures?: boolean
}

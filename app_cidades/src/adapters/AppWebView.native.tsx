import { forwardRef } from 'react'
import RNWebView, { WebView as RNWebViewInstance } from 'react-native-webview'
import type { AppWebViewProps } from './appWebView.types'

export type { AppWebViewProps, AppWebViewRef, WebViewMessageEvent } from './appWebView.types'

export const AppWebView = forwardRef<RNWebViewInstance, AppWebViewProps>(function AppWebView(
  props,
  ref,
) {
  return <RNWebView ref={ref} {...props} />
})

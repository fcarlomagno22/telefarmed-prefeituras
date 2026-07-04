import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { injectAppWebViewBridge, parseAppWebViewMessageData } from './appWebViewBridge'
import type { AppWebViewProps, AppWebViewRef } from './appWebView.types'

export type { AppWebViewProps, AppWebViewRef, WebViewMessageEvent } from './appWebView.types'

type IframeProps = {
  src?: string
  srcDoc?: string
  title: string
  style: ViewStyle
  onLoad: () => void
}

const Iframe = 'iframe' as unknown as ComponentType<IframeProps & { ref?: never }>

function flattenIframeStyle(style: AppWebViewProps['style']): ViewStyle {
  const flat = StyleSheet.flatten(style) ?? {}

  return {
    borderWidth: 0,
    width: '100%',
    height: flat.height ?? '100%',
    flex: flat.flex ?? 1,
    backgroundColor: flat.backgroundColor,
  }
}

export const AppWebView = forwardRef<AppWebViewRef, AppWebViewProps>(function AppWebView(
  {
    source,
    style,
    scrollEnabled = true,
    onMessage,
    onLoadEnd,
    startInLoadingState = false,
    renderLoading,
  },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(startInLoadingState && 'uri' in source))
  const htmlDocument = useMemo(
    () => ('html' in source ? injectAppWebViewBridge(source.html) : undefined),
    [source],
  )

  useImperativeHandle(ref, () => ({
    injectJavaScript(script: string) {
      const contentWindow = iframeRef.current?.contentWindow
      if (!contentWindow) return

      try {
        contentWindow.eval(script)
      } catch {
        // Ignore script errors from injected map updates.
      }
    },
  }))

  useEffect(() => {
    if (!onMessage) return

    function handleWindowMessage(event: MessageEvent) {
      const iframeWindow = iframeRef.current?.contentWindow
      if (!iframeWindow || event.source !== iframeWindow) return

      const data = parseAppWebViewMessageData(event.data)
      if (!data) return

      onMessage({ nativeEvent: { data } })
    }

    window.addEventListener('message', handleWindowMessage)
    return () => window.removeEventListener('message', handleWindowMessage)
  }, [onMessage])

  function handleLoad() {
    setIsLoading(false)
    onLoadEnd?.()
  }

  return (
    <View
      style={[styles.container, style]}
      pointerEvents={scrollEnabled ? 'auto' : 'box-none'}
    >
      <Iframe
        ref={iframeRef as never}
        title="App embedded content"
        src={'uri' in source ? source.uri : undefined}
        srcDoc={htmlDocument}
        style={iframeStyle}
        onLoad={handleLoad}
      />
      {isLoading && renderLoading ? <View style={styles.loadingOverlay}>{renderLoading()}</View> : null}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
})

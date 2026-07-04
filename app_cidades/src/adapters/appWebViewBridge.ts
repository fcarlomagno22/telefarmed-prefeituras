const WEBVIEW_BRIDGE_SCRIPT = `
<script id="__app-webview-bridge">
(function () {
  if (window.ReactNativeWebView) return;
  window.ReactNativeWebView = {
    postMessage: function (data) {
      window.parent.postMessage(JSON.stringify({
        __appWebViewBridge: true,
        payload: typeof data === 'string' ? data : String(data)
      }), '*');
    }
  };
})();
</script>
`

export function injectAppWebViewBridge(html: string): string {
  if (html.includes('__app-webview-bridge')) {
    return html
  }

  const headMatch = html.match(/<head[^>]*>/i)
  if (headMatch) {
    return html.replace(headMatch[0], `${headMatch[0]}${WEBVIEW_BRIDGE_SCRIPT}`)
  }

  const htmlMatch = html.match(/<html[^>]*>/i)
  if (htmlMatch) {
    return html.replace(htmlMatch[0], `${htmlMatch[0]}<head>${WEBVIEW_BRIDGE_SCRIPT}</head>`)
  }

  return `${WEBVIEW_BRIDGE_SCRIPT}${html}`
}

export function parseAppWebViewMessageData(rawData: unknown): string | null {
  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData) as { __appWebViewBridge?: boolean; payload?: string }
      if (parsed.__appWebViewBridge && typeof parsed.payload === 'string') {
        return parsed.payload
      }
    } catch {
      return rawData
    }

    return rawData
  }

  if (rawData && typeof rawData === 'object') {
    return JSON.stringify(rawData)
  }

  return null
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_COLOR: string
  readonly VITE_LOGO_URL: string
  readonly VITE_BACKGROUND_IMAGE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_APP_TAGLINE: string
  readonly VITE_HEADLINE: string
  readonly VITE_SUBHEADLINE: string
  readonly VITE_WELCOME_TITLE: string
  readonly VITE_WELCOME_SUBTITLE: string
  readonly VITE_COPYRIGHT: string
  readonly VITE_DASHBOARD_USER_NAME: string
  readonly VITE_OPERATOR_NAME: string
  readonly VITE_OPERATOR_ROLE: string
  readonly VITE_OPERATOR_FOOTER_LABEL: string
  readonly VITE_DASHBOARD_TITLE: string
  readonly VITE_DASHBOARD_SUBTITLE: string
  readonly VITE_DASHBOARD_STATION_TITLE: string
  readonly VITE_DASHBOARD_STATION_IDLE_HINT: string
  readonly VITE_DASHBOARD_FLOW_IMAGE_URL: string
  readonly VITE_DASHBOARD_DOCTORS_IMAGE_URL: string
  readonly VITE_DASHBOARD_PROMO_IMAGE_URL: string
  readonly VITE_DASHBOARD_PROMO_TEXT: string
  readonly VITE_LIVEKIT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

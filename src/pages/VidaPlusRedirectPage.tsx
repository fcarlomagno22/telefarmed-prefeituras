import { useEffect } from 'react'
import { resolveVidaPlusAppUrl } from '../config/vidaPlusRoutes'

export function VidaPlusRedirectPage() {
  useEffect(() => {
    window.location.replace(resolveVidaPlusAppUrl())
  }, [])

  return null
}

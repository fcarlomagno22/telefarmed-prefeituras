import { useEffect } from 'react'
import { MedicoCadastroLandingPageContent } from '../components/landing/medicoCadastro/MedicoCadastroLandingPageContent'
import { brand } from '../config/brand'
import { getDedicatedPortal } from '../config/portalHost'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function MedicoCadastroLandingPage() {
  useBrandTheme()

  useEffect(() => {
    if (getDedicatedPortal()) return
    const previous = document.title
    document.title = `${brand.appName} — Cadastro de médicos`
    return () => {
      document.title = previous
    }
  }, [])

  return <MedicoCadastroLandingPageContent />
}

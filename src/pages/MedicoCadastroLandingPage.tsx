import { useEffect } from 'react'
import { MedicoCadastroLandingPageContent } from '../components/landing/medicoCadastro/MedicoCadastroLandingPageContent'
import { brand } from '../config/brand'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function MedicoCadastroLandingPage() {
  useBrandTheme()

  useEffect(() => {
    const previous = document.title
    document.title = `${brand.appName} — Cadastro de médicos`
    return () => {
      document.title = previous
    }
  }, [])

  return <MedicoCadastroLandingPageContent />
}

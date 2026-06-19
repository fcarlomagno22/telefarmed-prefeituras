import { MedicoCadastroLandingPageContent } from '../components/landing/medicoCadastro/MedicoCadastroLandingPageContent'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function MedicoCadastroLandingPage() {
  useBrandTheme()

  return <MedicoCadastroLandingPageContent />
}

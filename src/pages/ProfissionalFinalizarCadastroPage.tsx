import { useEffect } from 'react'
import { ProfissionalFinalizarCadastroPageContent } from '../components/profissional/finalizarCadastro/ProfissionalFinalizarCadastroPageContent'
import { brand } from '../config/brand'
import { getDedicatedPortal } from '../config/portalHost'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function ProfissionalFinalizarCadastroPage() {
  useBrandTheme()

  useEffect(() => {
    if (getDedicatedPortal()) return
    const previous = document.title
    document.title = `${brand.appName} — Finalizar cadastro`
    return () => {
      document.title = previous
    }
  }, [])

  return <ProfissionalFinalizarCadastroPageContent />
}

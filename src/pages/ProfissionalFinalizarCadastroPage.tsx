import { useEffect } from 'react'
import { ProfissionalFinalizarCadastroPageContent } from '../components/profissional/finalizarCadastro/ProfissionalFinalizarCadastroPageContent'
import { brand } from '../config/brand'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function ProfissionalFinalizarCadastroPage() {
  useBrandTheme()

  useEffect(() => {
    const previous = document.title
    document.title = `${brand.appName} — Finalizar cadastro`
    return () => {
      document.title = previous
    }
  }, [])

  return <ProfissionalFinalizarCadastroPageContent />
}

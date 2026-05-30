import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  configCatalogStatusBadgeConfig,
  configCatalogStatusBadgeWidth,
} from './adminConfiguracoesUi'

export function ConfigCatalogStatusBadge({ active }: { active: boolean }) {
  return (
    <SituationStatusBadge
      config={configCatalogStatusBadgeConfig[active ? 'ativo' : 'inativo']}
      widthClass={configCatalogStatusBadgeWidth}
    />
  )
}

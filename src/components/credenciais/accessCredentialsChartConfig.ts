import type { AccessLevelId } from '../../config/accessCredentials'

export type AccessLevelGradient = {
  label: string
  gradientFrom: string
  gradientTo: string
}

export const accessLevelGradients: Record<AccessLevelId, AccessLevelGradient> = {
  administrador: {
    label: 'Administradores',
    gradientFrom: '#fbbf24',
    gradientTo: '#ea580c',
  },
  operador: {
    label: 'Operadores',
    gradientFrom: '#38bdf8',
    gradientTo: '#2563eb',
  },
  editor: {
    label: 'Editores',
    gradientFrom: '#a78bfa',
    gradientTo: '#7c3aed',
  },
  visualizador: {
    label: 'Visualizadores',
    gradientFrom: '#d1d5db',
    gradientTo: '#64748b',
  },
}

export const statusGradients = {
  ativo: {
    label: 'Ativos',
    gradientFrom: '#34d399',
    gradientTo: '#059669',
  },
  inativo: {
    label: 'Bloqueados',
    gradientFrom: '#fb7185',
    gradientTo: '#dc2626',
  },
} as const

import { prefeituraRedeUnits } from './prefeituraRedeMock'

export type BroadcastRecipientScope = 'ubt' | 'responsible' | 'operators'

export type PrefeituraRedeUbtOperator = {
  id: string
  unitId: string
  name: string
  role: string
}

export const broadcastRecipientScopeOptions: {
  id: BroadcastRecipientScope
  label: string
  description: string
}[] = [
  {
    id: 'ubt',
    label: 'UBT inteira',
    description: 'Comunicado para toda a unidade (painéis e estações).',
  },
  {
    id: 'responsible',
    label: 'Responsável',
    description: 'Mensagem direta para o responsável cadastrado na UBT.',
  },
  {
    id: 'operators',
    label: 'Operadoras',
    description: 'Uma ou mais usuárias cadastradas pela responsável na unidade.',
  },
]

const operatorTemplates: { name: string; role: string }[][] = [
  [
    { name: 'Juliana Martins', role: 'Enfermeira' },
    { name: 'Camila Rocha', role: 'Recepcionista' },
    { name: 'Beatriz Alves', role: 'Assistente de triagem' },
  ],
  [
    { name: 'Fernanda Oliveira', role: 'Enfermeira' },
    { name: 'Larissa Nunes', role: 'Recepcionista' },
  ],
  [
    { name: 'Mariana Costa', role: 'Técnica de enfermagem' },
    { name: 'Patrícia Lima', role: 'Recepcionista' },
    { name: 'Aline Souza', role: 'Operadora de triagem' },
  ],
  [
    { name: 'Gabriela Mendes', role: 'Enfermeira' },
    { name: 'Renata Dias', role: 'Assistente administrativa' },
  ],
  [
    { name: 'Carla Teixeira', role: 'Recepcionista' },
    { name: 'Vanessa Prado', role: 'Enfermeira' },
    { name: 'Helena Borges', role: 'Operadora de triagem' },
  ],
  [
    { name: 'Isabela Ribeiro', role: 'Técnica de enfermagem' },
    { name: 'Natália Freitas', role: 'Recepcionista' },
  ],
]

export const prefeituraRedeUbtOperators: PrefeituraRedeUbtOperator[] = prefeituraRedeUnits.flatMap(
  (unit, unitIndex) => {
    const templates = operatorTemplates[unitIndex % operatorTemplates.length] ?? operatorTemplates[0]!
    return templates.map((template, operatorIndex) => ({
      id: `${unit.id}-op-${operatorIndex}`,
      unitId: unit.id,
      name: template.name,
      role: template.role,
    }))
  },
)

export function getOperatorsForUnit(unitId: string) {
  return prefeituraRedeUbtOperators.filter((operator) => operator.unitId === unitId)
}

export function getOperatorsForUnits(unitIds: Iterable<string>) {
  const ids = new Set(unitIds)
  return prefeituraRedeUbtOperators.filter((operator) => ids.has(operator.unitId))
}

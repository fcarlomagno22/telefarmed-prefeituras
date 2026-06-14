/** Opções estáticas de filtro (enums de UI — não são dados mock de consultas). */
export const consultasStaticFilterOptions = {
  genders: [
    { value: '', label: 'Todos' },
    { value: 'F', label: 'Feminino' },
    { value: 'M', label: 'Masculino' },
  ],
  ageRanges: [
    { value: '', label: 'Todas' },
    { value: '0-17', label: '0 a 17 anos' },
    { value: '18-39', label: '18 a 39 anos' },
    { value: '40-59', label: '40 a 59 anos' },
    { value: '60+', label: '60 anos ou mais' },
  ],
  statuses: [
    { value: '', label: 'Todos' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'em_andamento', label: 'Em andamento' },
  ],
} as const

export function buildConsultasUnitFilterOptions(unidadeUbtId?: string, unidadeUbtNome?: string) {
  const options: Array<{ value: string; label: string }> = [{ value: '', label: 'Todas' }]
  if (unidadeUbtId && unidadeUbtNome) {
    options.push({ value: unidadeUbtId, label: unidadeUbtNome })
  }
  return options
}

export function withAllOption<T extends { value: string; label: string }>(
  items: T[],
  allLabel: string,
): Array<{ value: string; label: string }> {
  return [{ value: '', label: allLabel }, ...items]
}

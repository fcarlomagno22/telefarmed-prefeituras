export type ReferralSpecialtyOption = {
  id: string
  label: string
}

/** Especialidades mais solicitadas em encaminhamentos da APS — ordem alfabética em pt-BR. */
export const DOCTOR_REFERRAL_SPECIALTIES: ReferralSpecialtyOption[] = [
  { id: 'alergologia', label: 'Alergologia e Imunologia' },
  { id: 'cardiologia', label: 'Cardiologia' },
  { id: 'cirurgia-geral', label: 'Cirurgia Geral' },
  { id: 'clinica-medica', label: 'Clínica Médica' },
  { id: 'dermatologia', label: 'Dermatologia' },
  { id: 'endocrinologia', label: 'Endocrinologia e Metabologia' },
  { id: 'gastroenterologia', label: 'Gastroenterologia' },
  { id: 'geriatria', label: 'Geriatria' },
  { id: 'ginecologia', label: 'Ginecologia e Obstetrícia' },
  { id: 'hematologia', label: 'Hematologia' },
  { id: 'infectologia', label: 'Infectologia' },
  { id: 'mastologia', label: 'Mastologia' },
  { id: 'nefrologia', label: 'Nefrologia' },
  { id: 'neurologia', label: 'Neurologia' },
  { id: 'nutricao', label: 'Nutrição' },
  { id: 'oftalmologia', label: 'Oftalmologia' },
  { id: 'oncologia', label: 'Oncologia' },
  { id: 'ortopedia', label: 'Ortopedia e Traumatologia' },
  { id: 'otorrino', label: 'Otorrinolaringologia' },
  { id: 'pediatria', label: 'Pediatria' },
  { id: 'pneumologia', label: 'Pneumologia' },
  { id: 'psiquiatria', label: 'Psiquiatria' },
  { id: 'reumatologia', label: 'Reumatologia' },
  { id: 'urologia', label: 'Urologia' },
  { id: 'outra', label: 'Outra especialidade / serviço' },
]

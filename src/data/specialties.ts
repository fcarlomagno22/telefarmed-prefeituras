export type Specialty = {
  id: string
  name: string
  available: boolean
}

export const specialties: Specialty[] = [
  { id: '4', name: 'Clínica Geral', available: true },
  { id: '3', name: 'Pediatria', available: true },
  { id: '7', name: 'Cardiologia', available: true },
  { id: '14', name: 'Dermatologia', available: true },
  { id: '15', name: 'Endocrinologia', available: false },
  { id: '113', name: 'Endocrinologa Pediátrica', available: false },
  { id: '16', name: 'Gastroenterologia', available: true },
  { id: '18', name: 'Geriatria', available: true },
  { id: '19', name: 'Ginecologia', available: true },
  { id: '244', name: 'Ginecologia e Obstetrícia', available: false },
  { id: '339', name: 'Homeopatia', available: false },
  { id: '200', name: 'Homeopatia Pediátrica', available: false },
  { id: '179', name: 'Medicina da Família', available: true },
  { id: '26', name: 'Neurologia', available: true },
  { id: '337', name: 'Nutrologia Adulto', available: true },
  { id: '187', name: 'Nutrologia Pediátrica', available: false },
  { id: '34', name: 'Orientação Nutricional', available: false },
  { id: '132', name: 'Ortopedia e Traumatologia', available: true },
  { id: '29', name: 'Otorrinolaringologia', available: true },
  { id: '33', name: 'Psicologia', available: true },
  { id: '331', name: 'Fonoaudiologia', available: true },
  { id: '32', name: 'Psiquiatria', available: false },
  { id: '37', name: 'Reumatologia', available: false },
  { id: '38', name: 'Urologia', available: true },
]

export function getSpecialtyById(id: string): Specialty | undefined {
  return specialties.find((item) => item.id === id)
}

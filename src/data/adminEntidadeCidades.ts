import type { CustomSelectOption } from '../components/ui/CustomSelect'

/** Municípios por UF para cadastro de entidades (recorte operacional Telefarmed). */
const cidadesPorUf: Record<string, readonly string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
  AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo', 'Penedo'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari'],
  BA: [
    'Salvador',
    'Feira de Santana',
    'Vitória da Conquista',
    'Camaçari',
    'Itabuna',
    'Juazeiro',
    'Lauro de Freitas',
    'Ilhéus',
  ],
  CE: [
    'Fortaleza',
    'Caucaia',
    'Juazeiro do Norte',
    'Maracanaú',
    'Sobral',
    'Crato',
    'Itapipoca',
  ],
  DF: [
    'Brasília',
    'Taguatinga',
    'Ceilândia',
    'Samambaia',
    'Planaltina',
    'Gama',
    'Sobradinho',
    'Águas Claras',
  ],
  ES: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Linhares', 'Cachoeiro de Itapemirim'],
  GO: [
    'Goiânia',
    'Aparecida de Goiânia',
    'Anápolis',
    'Rio Verde',
    'Luziânia',
    'Águas Lindas de Goiás',
    'Valparaíso de Goiás',
    'Trindade',
    'Formosa',
    'Catalão',
  ],
  MA: ['São Luís', 'Imperatriz', 'Caxias', 'Timon', 'Codó', 'Paço do Lumiar'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Cáceres'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
  MG: [
    'Belo Horizonte',
    'Uberlândia',
    'Contagem',
    'Betim',
    'Juiz de Fora',
    'Montes Claros',
    'Uberaba',
    'Governador Valadares',
    'Ipatinga',
    'Sete Lagoas',
    'Divinópolis',
    'Poços de Caldas',
    'Barbacena',
  ],
  PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal', 'Parauapebas'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'],
  PR: [
    'Curitiba',
    'Londrina',
    'Maringá',
    'Ponta Grossa',
    'Cascavel',
    'São José dos Pinhais',
    'Foz do Iguaçu',
    'Colombo',
  ],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista'],
  PI: ['Teresina', 'Parnaíba', 'Picos', 'Floriano', 'Piripiri'],
  RJ: [
    'Rio de Janeiro',
    'São Gonçalo',
    'Duque de Caxias',
    'Nova Iguaçu',
    'Niterói',
    'Campos dos Goytacazes',
    'Petrópolis',
    'Volta Redonda',
  ],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'],
  RS: [
    'Porto Alegre',
    'Caxias do Sul',
    'Pelotas',
    'Canoas',
    'Santa Maria',
    'Gravataí',
    'Novo Hamburgo',
    'São Leopoldo',
  ],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí'],
  SC: [
    'Florianópolis',
    'Joinville',
    'Blumenau',
    'São José',
    'Chapecó',
    'Itajaí',
    'Criciúma',
    'Jaraguá do Sul',
  ],
  SP: [
    'São Paulo',
    'Guarulhos',
    'Campinas',
    'São Bernardo do Campo',
    'Santo André',
    'Osasco',
    'Sorocaba',
    'Ribeirão Preto',
    'Santos',
    'São José dos Campos',
    'Mauá',
    'Diadema',
    'Jundiaí',
    'Piracicaba',
  ],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão'],
  TO: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins'],
}

function sortCidades(cities: readonly string[]) {
  return [...cities].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function getAdminEntidadeCidadeOptions(uf: string): CustomSelectOption[] {
  const cities = cidadesPorUf[uf]
  if (!cities?.length) return []

  return sortCidades(cities).map((city) => ({
    value: city,
    label: city,
  }))
}

export function isAdminEntidadeCidadeInUf(uf: string, cidade: string) {
  const cities = cidadesPorUf[uf]
  if (!cities?.length) return false
  return cities.includes(cidade)
}

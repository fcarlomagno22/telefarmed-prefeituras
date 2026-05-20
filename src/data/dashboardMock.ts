export const metrics = [
  {
    id: 'waiting',
    title: 'Pacientes Aguardando',
    value: '18',
    subtext: '+ 4 desde a última hora',
    subtextClass: 'text-gray-500',
    iconTone: 'orange' as const,
    sparkline: [4, 6, 5, 8, 7, 10, 12, 14, 13, 18],
  },
  {
    id: 'in-progress',
    title: 'Consultas em Andamento',
    value: '7',
    subtext: '3 salas ocupadas',
    subtextClass: 'text-gray-500',
    iconTone: 'orange' as const,
    sparkline: [3, 5, 4, 6, 5, 7, 6, 8, 7, 7],
  },
  {
    id: 'doctors',
    title: 'Médicos Online',
    value: '12',
    subtext: 'de 18 disponíveis',
    subtextClass: 'text-gray-500',
    iconTone: 'green' as const,
    sparkline: [8, 9, 10, 11, 10, 12, 11, 12, 12, 12],
  },
  {
    id: 'wait-time',
    title: 'Tempo Médio de Espera',
    value: '24 min',
    subtext: '-5 min que ontem',
    subtextClass: 'text-emerald-600',
    iconTone: 'orange' as const,
    sparkline: [32, 30, 28, 29, 27, 26, 25, 24, 24, 24],
  },
  {
    id: 'alerts',
    title: 'Alertas Importantes',
    value: '2',
    subtext: 'Ver detalhes',
    subtextClass: 'text-[var(--brand-primary)] font-medium',
    iconTone: 'red' as const,
    isAlert: true,
  },
]

export const serviceFlow = [
  { label: 'Aguardando', count: 18, tone: 'orange' as const, progress: 72 },
  { label: 'Em andamento', count: 7, tone: 'orange' as const, progress: 45 },
  { label: 'Concluídas hoje', count: 23, tone: 'green' as const, progress: 85 },
  { label: 'Chamadas pendentes', count: 3, tone: 'red' as const, progress: 25 },
]

export const doctorsOnline = [
  {
    id: '1',
    name: 'Dr. Marcos Silva',
    specialty: 'Clínico Geral',
    status: 'online' as const,
    avatar: 'https://i.pravatar.cc/80?img=12',
  },
  {
    id: '2',
    name: 'Dra. Ana Costa',
    specialty: 'Pediatria',
    status: 'consulting' as const,
    avatar: 'https://i.pravatar.cc/80?img=5',
  },
  {
    id: '3',
    name: 'Dr. Paulo Mendes',
    specialty: 'Cardiologia',
    status: 'online' as const,
    avatar: 'https://i.pravatar.cc/80?img=33',
  },
  {
    id: '4',
    name: 'Dra. Carla Souza',
    specialty: 'Dermatologia',
    status: 'consulting' as const,
    avatar: 'https://i.pravatar.cc/80?img=9',
  },
  {
    id: '5',
    name: 'Dr. Ricardo Alves',
    specialty: 'Ortopedia',
    status: 'online' as const,
    avatar: 'https://i.pravatar.cc/80?img=15',
  },
  {
    id: '6',
    name: 'Dra. Fernanda Rocha',
    specialty: 'Ginecologia',
    status: 'online' as const,
    avatar: 'https://i.pravatar.cc/80?img=25',
  },
  {
    id: '7',
    name: 'Dr. Lucas Pereira',
    specialty: 'Neurologia',
    status: 'consulting' as const,
    avatar: 'https://i.pravatar.cc/80?img=68',
  },
  {
    id: '8',
    name: 'Dra. Beatriz Nunes',
    specialty: 'Psiquiatria',
    status: 'online' as const,
    avatar: 'https://i.pravatar.cc/80?img=44',
  },
  {
    id: '9',
    name: 'Dr. Eduardo Martins',
    specialty: 'Oftalmologia',
    status: 'consulting' as const,
    avatar: 'https://i.pravatar.cc/80?img=52',
  },
  {
    id: '10',
    name: 'Dra. Juliana Dias',
    specialty: 'Endocrinologia',
    status: 'online' as const,
    avatar: 'https://i.pravatar.cc/80?img=32',
  },
]

export const rooms = [
  { id: '1', name: 'Sala 1', specialty: 'Clínico Geral', status: 'available' as const },
  { id: '2', name: 'Sala 2', specialty: 'Pediatria', status: 'busy' as const },
  { id: '3', name: 'Sala 3', specialty: 'Cardiologia', status: 'available' as const },
  { id: '4', name: 'Sala 4', specialty: 'Dermatologia', status: 'busy' as const },
  { id: '5', name: 'Sala 5', specialty: '—', status: 'maintenance' as const },
]

export const nextConsultations = [
  {
    id: '1',
    time: '10:30',
    patient: 'Maria Oliveira',
    specialty: 'Clínico Geral',
    status: 'waiting' as const,
  },
  {
    id: '2',
    time: '10:45',
    patient: 'João Santos',
    specialty: 'Pediatria',
    status: 'confirmed' as const,
  },
  {
    id: '3',
    time: '11:00',
    patient: 'Ana Paula Lima',
    specialty: 'Cardiologia',
    status: 'waiting' as const,
  },
  {
    id: '4',
    time: '11:15',
    patient: 'Carlos Ferreira',
    specialty: 'Dermatologia',
    status: 'confirmed' as const,
  },
]

export const quickActions = [
  { id: 'open', label: 'Abrir Atendimento' },
  { id: 'schedule', label: 'Agendar Consulta' },
  { id: 'room', label: 'Entrar em Sala' },
  { id: 'receipt', label: 'Reimprimir Comprovante' },
  { id: 'search', label: 'Buscar Paciente' },
  { id: 'emergency', label: 'Encaminhar Emergência' },
]

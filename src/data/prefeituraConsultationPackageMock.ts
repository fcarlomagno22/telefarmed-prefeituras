/** Pacote de consultas contratado pelo município (ciclo mensal). */
export const prefeituraConsultationPackageBase = {
  /** Consultas incluídas por mês (renova no dia 1). */
  contractedTotal: 3_000,
  /** Utilização esperada ao fim do mês (baseline antes de recorte de filtros). */
  monthEndUsageBaseline: 4_200,
  /** Consultas já faturadas como avulso no mês (quando ultrapassa o pacote). */
  baseAvulsoCount: 0,
} as const

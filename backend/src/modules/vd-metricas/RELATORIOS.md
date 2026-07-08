# Relatórios PDF — decisão v1 (Fase 11)

## Decisão

**Não implementar `GET /api/v1/vd/metricas/relatorios/:tipo` na v1.**

Os relatórios de **glicemia**, **pressão arterial**, **hidratação**, **frequência cardíaca** e **composição corporal** permanecem **gerados no app** (`*ReportDrawer.tsx` + `utils/*Report*.ts` + adapters `pdfPrint` / `pdfDocument`).

As Fases 3–8 já expõem os dados necessários via API autenticada; o backend não precisa duplicar layout PDF neste momento.

## Motivos

| Critério | Cliente (atual) | Backend PDF (proposto) |
|----------|-----------------|-------------------------|
| Dados | Drawers carregam histórico via API e montam `*ReportSummary` | Repetir agregações já feitas no app |
| Layout | HTML + SVG (gráficos) → PDF (`expo-print` / `html2pdf`) | Reimplementar templates (pdfkit ou HTML server-side) |
| Plataformas | Adapters `.native.ts` / `.web.ts` para share e impressão | Um único stream PDF; integração mobile/web ainda no client |
| Manutenção | Uma fonte de verdade para regras clínicas de exibição (zonas, metas, tendências) | Duas bases (TS app + TS backend) ou contrato JSON estável + renderer |
| Escopo v1 | Funcional e integrado às APIs | Alto custo sem ganho claro para o paciente VD |

O backend já usa **pdfkit** em documentos clínicos do profissional (`backend/src/lib/documentos-clinicos/`). Reutilizar esse stack para métricas do app exigiria portar dezenas de funções de summary e centenas de linhas de template HTML—notadamente gráficos SVG de tendência—sem substituir o fluxo de share nativo.

## Fluxo atual (app)

```
GET /vd/metricas/{recurso}?start=&end=
        ↓
*HistoryStorage (cache offline por CPF)
        ↓
build*Report(history, period) → *ReportSummary
        ↓
*ReportPdfShared (HTML) → pdfPrint / pdfDocument → share
```

## Mapeamento API → relatório

| Relatório (`tipo` hipotético) | Drawer | Summary builder | Endpoints usados |
|-------------------------------|--------|-----------------|------------------|
| `glicemia` | `GlucoseReportDrawer` | `buildGlucoseReport` | `GET /glicemia` |
| `pressao` | `BloodPressureReportDrawer` | `buildBloodPressureReport` | `GET /pressao` |
| `hidratacao` | `HydrationReportDrawer` | `buildHydrationReport` | `GET /hidratacao` |
| `frequencia` | `HeartRateReportDrawer` | `buildHeartRateReport` | `GET /frequencia-cardiaca`, `GET /atividade` (passos/distância no insight) |
| `composicao-corporal` | `BodyCompositionReportDrawer` | `buildBodyCompositionReport` | `GET /peso`, `GET /medidas-corporais` (abdômen), `GET /perfil` |
| `medidas-corporais` | `BodyMeasurementsReportDrawer` | `buildBodyMeasurementsReport` | `GET /medidas-corporais` |

Complementar para cabeçalho/KPI: `GET /resumo` e `GET /perfil`.

Nenhum endpoint adicional é necessário para gerar PDF no dispositivo.

## Quando reconsiderar backend PDF

Priorizar server-side se surgir pelo menos um destes requisitos:

1. **Envio automático** (e-mail, prontuário, notificação) sem abrir o app.
2. **Portal admin / profissional** consumindo o mesmo PDF que o paciente vê.
3. **Auditoria / arquivo** com hash e versão de template centralizada.
4. **Dispositivos muito limitados** onde render HTML→PDF no client falha de forma sistemática.

Nesse caso, o desenho recomendado seria:

```
GET /api/v1/vd/metricas/relatorios/:tipo?start=&end=
  → 200 application/pdf
```

com `:tipo` ∈ `glicemia | pressao | hidratacao | frequencia | composicao-corporal | medidas-corporais`, reutilizando repositórios `vd-metricas` existentes e extraindo `build*Report` para um pacote compartilhado **ou** retornando JSON `*ReportSummary` em endpoint intermediário (`GET .../relatorios/:tipo/dados`) e mantendo PDF só onde for obrigatório.

## Referências no frontend

- Tipos: `app_cidades/src/types/glucose.ts`, `bloodPressure.ts`, `hydration.ts`, `heartRate.ts`, `bodyCompositionReport.ts`, `bodyMeasurementsReport.ts`
- PDF: `app_cidades/src/utils/*ReportPdfShared.ts`, `app_cidades/src/adapters/pdfPrint.*`, `pdfDocument.*`

## Status

- **Fase 11.1:** avaliado — **não implementado** (PDF permanece no app).
- **Fases 3–8:** fonte de dados dos relatórios — **suficientes para v1**.

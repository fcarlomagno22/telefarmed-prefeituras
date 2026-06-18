# Whitelabel — documentação operacional

Registro de decisões de produto, comunicação e QA para portais de entidades contratantes (prefeituras, Santas Casas e perfis genéricos).

---

## Decisões de produto

### 26. Prefixo de URL do portal de gestão (`/prefeitura/*` vs `/gestao/*`)

| Campo | Valor |
|-------|--------|
| **Status** | Decidido |
| **Data** | 2026-06-18 |
| **Decisão** | O caminho público/comunicação será **`/gestao/*`**. |
| **Estado atual (código)** | Rotas e `PortalId` interno permanecem **`prefeitura`** e prefixo **`/prefeitura/*`** (dev/local) ou subdomínio `prefeitura.telefarmed.com.br` (produção). |
| **Impacto imediato** | **Comunicação e documentação** — manuais, e-mails, credenciais, suporte e materiais para o cliente devem referenciar **`/gestao`** (ou “portal de gestão”), não “portal da prefeitura” como URL. |
| **Impacto técnico (futuro)** | Ver **[`docs/tenant-hosts.md`](tenant-hosts.md)** — URL pública por cliente: `{slug}.telefarmed.com.br` (gestão) e `{slug-ubt}.telefarmed.com.br` (UBT). Alias de path `/gestao/*` aplica-se só a dev/legado sem subdomínio dedicado. |
| **O que não muda agora** | Links internos gerados por `prefeituraRoutes`, APIs `/prefeitura/*`, nomes de módulos/pastas `prefeitura-*` e identificador `PortalId: 'prefeitura'`. |

#### Diretriz de comunicação

- **Usar:** “portal de gestão”, URL **`/gestao/login`**, **`/gestao/dashboard`**, etc.
- **Evitar em materiais externos:** “acesse `/prefeitura`” — termo legado/técnico.
- **UI whitelabel:** textos visíveis vêm de `terminologia.portal_gestao` (ex.: “portal administrativo” para Santa Casa), independente do prefixo técnico da rota.

#### Checklist para implementação futura do alias (não bloqueante para whitelabel)

- [ ] Registrar rotas espelhadas `/gestao/*` → mesmo bundle do portal `prefeitura`
- [ ] Redirect 301 opcional `/prefeitura/*` → `/gestao/*` (ou manter ambos)
- [ ] Atualizar `portalHost` / `portalPath` ou mapear `gestao` como alias de `prefeitura`
- [ ] Revisar links hardcoded em e-mails, PDFs e integrações externas
- [ ] Atualizar `AdminPrefeituraCredentialAboutPanel` e demais hints que citam `/prefeitura`

---

## Referência rápida — tipos de entidade

| Tipo | Território paciente (CEP) | RA no cadastro UBT | Gestor do portal | Satisfação (NPS) |
|------|---------------------------|--------------------|------------------|------------------|
| `prefeitura` | Município contratante se contrato não aceita outros | Obrigatória | gestor | NPS da rede |
| `santa_casa` | Livre | Opcional | gestor | NPS da população atendida |
| `generico` | Livre | Opcional | gestor | NPS da rede |

Terminologia padrão por tipo: `backend/src/lib/entidadeBranding/terminology.ts` e `src/lib/entidadeBranding/copy.ts`.

---

## QA manual sugerido (whitelabel)

Comparar **prefeitura** vs **Santa Casa** na mesma build, com branding carregado da entidade:

1. **Login e shell** — logo, cor primária, sidebar e títulos de documento.
2. **Triagem UBT** — CEP restrito vs livre conforme tipo e flag `aceitaPacientesOutrosMunicipios`.
3. **Cadastro UBT** — RA obrigatória vs opcional; mensagem de CEP.
4. **Credenciais** — rótulos de gestor e aba do portal de gestão.
5. **Relatório satisfação** — título e label do KPI NPS.
6. **Exports PDF** — sem cor fixa `#ff6b00`; termos substituídos pela terminologia da entidade.

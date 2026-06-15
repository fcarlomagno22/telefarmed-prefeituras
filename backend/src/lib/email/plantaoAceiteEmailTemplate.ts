import { PLANTAO_ACEITE_EMAIL_DEFAULTS } from './plantaoAceiteEmailConstants.js'

export type PlantaoAceiteEmailVariables = {
  especialidade: string
  data: string
  dia_semana: string
  hora_inicio: string
  hora_fim: string
  duracao: string
  turno: string
  modalidade: string
  local: string | null
  vagas_disponiveis: string
  valor_resumo: string
  repasse_resumo: string
  link_aceite: string
  link_escala: string
  prazo_aceite: string | null
  publicado_em: string
  nome_plataforma: string
}

const PLANTAO_ACEITE_EMAIL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no">
  <title>Novo plantão disponível</title>
</head>

<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px;">
    Novo plantão de {{especialidade}} disponível para {{data}}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;">
    <tr>
      <td align="center" style="padding:30px 15px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px; background:#ffffff; border-radius:18px; overflow:hidden;">

          <tr>
            <td style="height:6px; background:#ff7a00; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:30px;">

              <img
                src="{{logo_url}}"
                alt="{{nome_plataforma}}"
                width="180"
                style="display:block; margin-bottom:30px; max-width:100%; height:auto; border:0;"
              >

              <p style="margin:0 0 8px; color:#ff7a00; font-size:13px; font-weight:bold;">
                NOVO PLANTÃO DISPONÍVEL
              </p>

              <h1 style="margin:0 0 12px; color:#222222; font-size:28px; line-height:36px;">
                {{especialidade}}
              </h1>

              <p style="margin:0 0 25px; color:#666666; font-size:15px; line-height:23px;">
                Um novo plantão foi publicado e está disponível para aceite.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#fafafa; border:1px solid #eeeeee; border-radius:14px;">

                <tr>
                  <td style="padding:20px;">

                    <p style="margin:0 0 12px; color:#222222; font-size:15px;">
                      <strong>Data:</strong> {{data}} · {{dia_semana}}
                    </p>

                    <p style="margin:0 0 12px; color:#222222; font-size:15px;">
                      <strong>Horário:</strong> {{hora_inicio}} às {{hora_fim}} · {{duracao}}
                    </p>

                    <p style="margin:0 0 12px; color:#222222; font-size:15px;">
                      <strong>Turno:</strong> {{turno}}
                    </p>

                    <p style="margin:0 0 12px; color:#222222; font-size:15px;">
                      <strong>Modalidade:</strong> {{modalidade}}
                    </p>

                    {{local_line}}

                    <p style="margin:0; color:#222222; font-size:15px;">
                      <strong>Vagas disponíveis:</strong> {{vagas_disponiveis}}
                    </p>

                  </td>
                </tr>
              </table>

              <div style="margin-top:20px; padding:20px; background:#fff4ea; border-radius:14px;">

                <p style="margin:0 0 6px; color:#a64c00; font-size:13px; font-weight:bold;">
                  VALOR DO REPASSE
                </p>

                <p style="margin:0 0 6px; color:#ff7a00; font-size:25px; font-weight:bold;">
                  {{valor_resumo}}
                </p>

                <p style="margin:0; color:#555555; font-size:14px; line-height:21px;">
                  {{repasse_resumo}}
                </p>

              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:25px;">
                <tr>
                  <td align="center">
                    <a
                      href="{{link_aceite}}"
                      target="_blank"
                      style="display:inline-block; background:#ff7a00; color:#ffffff; padding:16px 28px; border-radius:10px; font-size:16px; font-weight:bold; text-decoration:none;"
                    >
                      Aceitar plantão
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:14px; color:#888888; font-size:12px; line-height:18px;">
                    {{prazo_aceite_line}}
                  </td>
                </tr>
              </table>

              <p style="margin:25px 0 0; color:#888888; font-size:12px; text-align:center;">
                Caso o botão não funcione,
                <a href="{{link_escala}}" target="_blank" style="color:#ff7a00;">
                  acesse sua escala
                </a>.
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:20px 30px; background:#222222; text-align:center;">

              <p style="margin:0 0 5px; color:#ffffff; font-size:13px; font-weight:bold;">
                {{nome_plataforma}}
              </p>

              <p style="margin:0; color:#aaaaaa; font-size:11px;">
                Plantão publicado em {{publicado_em}}.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const UNESCAPED_TEMPLATE_KEYS = new Set([
  'link_aceite',
  'link_escala',
  'logo_url',
  'local_line',
  'prazo_aceite_line',
])

function applyTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let output = template
  for (const [key, value] of Object.entries(variables)) {
    const safe = UNESCAPED_TEMPLATE_KEYS.has(key) ? value : escapeHtml(value)
    output = output.replaceAll(`{{${key}}}`, safe)
  }
  return output
}

function buildLocalLine(local: string | null): string {
  if (!local?.trim()) return ''
  return `<p style="margin:0 0 12px; color:#222222; font-size:15px;"><strong>Local:</strong> ${escapeHtml(local.trim())}</p>`
}

function buildPrazoAceiteLine(prazoAceite: string | null): string {
  if (!prazoAceite?.trim()) return '&nbsp;'
  return `Aceite disponível até ${escapeHtml(prazoAceite.trim())}.`
}

export function buildPlantaoAceiteEmailHtml(variables: PlantaoAceiteEmailVariables): string {
  return applyTemplateVariables(PLANTAO_ACEITE_EMAIL_HTML, {
    especialidade: variables.especialidade,
    data: variables.data,
    dia_semana: variables.dia_semana,
    hora_inicio: variables.hora_inicio,
    hora_fim: variables.hora_fim,
    duracao: variables.duracao,
    turno: variables.turno,
    modalidade: variables.modalidade,
    vagas_disponiveis: variables.vagas_disponiveis,
    valor_resumo: variables.valor_resumo,
    repasse_resumo: variables.repasse_resumo,
    link_aceite: variables.link_aceite,
    link_escala: variables.link_escala,
    publicado_em: variables.publicado_em,
    nome_plataforma: variables.nome_plataforma,
    logo_url: PLANTAO_ACEITE_EMAIL_DEFAULTS.logo_url,
    local_line: buildLocalLine(variables.local),
    prazo_aceite_line: buildPrazoAceiteLine(variables.prazo_aceite),
  })
}

export function buildPlantaoAceiteEmailText(variables: PlantaoAceiteEmailVariables): string {
  const lines = [
    `${variables.nome_plataforma} — Novo plantão disponível`,
    '',
    `${variables.especialidade}`,
    '',
    `Data: ${variables.data} · ${variables.dia_semana}`,
    `Horário: ${variables.hora_inicio} às ${variables.hora_fim} · ${variables.duracao}`,
    `Turno: ${variables.turno}`,
    `Modalidade: ${variables.modalidade}`,
  ]

  if (variables.local?.trim()) {
    lines.push(`Local: ${variables.local.trim()}`)
  }

  lines.push(
    `Vagas disponíveis: ${variables.vagas_disponiveis}`,
    '',
    `Valor do repasse: ${variables.valor_resumo}`,
    variables.repasse_resumo,
    '',
    `Aceitar plantão: ${variables.link_aceite}`,
  )

  if (variables.prazo_aceite?.trim()) {
    lines.push(`Aceite disponível até ${variables.prazo_aceite.trim()}.`)
  }

  lines.push(
    '',
    `Caso o link não funcione, acesse sua escala: ${variables.link_escala}`,
    '',
    `Plantão publicado em ${variables.publicado_em}.`,
  )

  return lines.join('\n')
}

import { PLANTAO_ACEITE_EMAIL_DEFAULTS } from './plantaoAceiteEmailConstants.js'
import type { PlantaoAceiteDigestEmailVariables } from './plantaoAceiteDigestEmailFormatters.js'

const PLANTAO_ACEITE_DIGEST_EMAIL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no">
  <title>Vagas de plantão disponíveis</title>
</head>

<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px;">
    {{total_plantoes}} vagas de plantão disponíveis para você.
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
                VAGAS DE PLANTÃO DISPONÍVEIS
              </p>

              <h1 style="margin:0 0 12px; color:#222222; font-size:28px; line-height:36px;">
                {{total_plantoes}} plantões para você
              </h1>

              <p style="margin:0 0 25px; color:#666666; font-size:15px; line-height:23px;">
                Foram publicadas novas vagas compatíveis com seu perfil. Abra o link abaixo para ver todas e escolher qual aceitar.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#fafafa; border:1px solid #eeeeee; border-radius:14px;">

                <tr>
                  <td style="padding:20px;">
                    {{slots_rows_html}}
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:25px;">
                <tr>
                  <td align="center">
                    <a
                      href="{{link_vagas}}"
                      target="_blank"
                      style="display:inline-block; background:#ff7a00; color:#ffffff; padding:16px 28px; border-radius:10px; font-size:16px; font-weight:bold; text-decoration:none;"
                    >
                      Ver todas as vagas
                    </a>
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
                Publicado em {{publicado_em}}.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`

const UNESCAPED_TEMPLATE_KEYS = new Set(['link_vagas', 'link_escala', 'logo_url', 'slots_rows_html'])

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

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

export function buildPlantaoAceiteDigestEmailHtml(
  variables: PlantaoAceiteDigestEmailVariables,
): string {
  return applyTemplateVariables(PLANTAO_ACEITE_DIGEST_EMAIL_HTML, {
    total_vagas: variables.total_vagas,
    total_plantoes: variables.total_plantoes,
    slots_rows_html: variables.slots_rows_html,
    link_vagas: variables.link_vagas,
    link_escala: variables.link_escala,
    publicado_em: variables.publicado_em,
    nome_plataforma: variables.nome_plataforma,
    logo_url: PLANTAO_ACEITE_EMAIL_DEFAULTS.logo_url,
  })
}

export function buildPlantaoAceiteDigestEmailText(
  variables: PlantaoAceiteDigestEmailVariables,
): string {
  const lines = [
    `${variables.nome_plataforma} — Vagas de plantão disponíveis`,
    '',
    `${variables.total_plantoes} plantões compatíveis com seu perfil.`,
    '',
    variables.slots_rows_text,
    '',
    `Ver todas as vagas: ${variables.link_vagas}`,
    '',
    `Caso o link não funcione, acesse sua escala: ${variables.link_escala}`,
    '',
    `Publicado em ${variables.publicado_em}.`,
  ]

  return lines.join('\n')
}

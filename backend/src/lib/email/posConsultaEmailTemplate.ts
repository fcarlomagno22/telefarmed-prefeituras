import { POS_CONSULTA_EMAIL_DEFAULTS } from './posConsultaEmailConstants.js'

export type PosConsultaCheckinEmailVariables = {
  patientFirstName: string
  specialtyName: string
  planDayNumber: number
  planTotalDays: number
  checkinNumber: number
  totalCheckins: number
  doctorName: string
  checkinUrl: string
  sentAtLabel: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPosConsultaCheckinEmailHtmlContent(variables: PosConsultaCheckinEmailVariables): string {
  const patientFirstName = escapeHtml(variables.patientFirstName)
  const specialtyName = escapeHtml(variables.specialtyName)
  const doctorName = escapeHtml(variables.doctorName)
  const checkinUrl = escapeHtml(variables.checkinUrl)
  const sentAtLabel = escapeHtml(variables.sentAtLabel)
  const planDayNumber = String(variables.planDayNumber)
  const planTotalDays = String(variables.planTotalDays)
  const checkinNumber = String(variables.checkinNumber)
  const totalCheckins = String(variables.totalCheckins)
  const logoUrl = escapeHtml(POS_CONSULTA_EMAIL_DEFAULTS.logo_url)
  const platformName = escapeHtml(POS_CONSULTA_EMAIL_DEFAULTS.nome_plataforma)
  const tokenHours = String(POS_CONSULTA_EMAIL_DEFAULTS.token_validade_horas)

  const preheader = escapeHtml(
    `Olá, ${variables.patientFirstName} — responda o check-in ${variables.checkinNumber} do seu acompanhamento pós-consulta. Link válido por ${POS_CONSULTA_EMAIL_DEFAULTS.token_validade_horas} horas.`,
  )

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no">
  <title>Acompanhamento pós-consulta — ${platformName}</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f6f8;
  font-family: Arial, Helvetica, sans-serif;
  color: #20242c;
">

  <div style="
    display: none;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    color: transparent;
    font-size: 1px;
    line-height: 1px;
  ">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f6f8;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="
          width: 100%;
          max-width: 580px;
          background-color: #ffffff;
          border: 1px solid #eceef1;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(22, 29, 37, 0.08);
        ">

          <tr>
            <td height="5" style="height: 5px; background-color: #f97316; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding: 30px 36px 8px 36px; background-color: #ffffff;">
              <img
                src="${logoUrl}"
                alt="${platformName}"
                width="180"
                style="
                  display: block;
                  width: 180px;
                  max-width: 100%;
                  height: auto;
                  margin: 0 auto;
                  border: 0;
                  outline: none;
                  text-decoration: none;
                "
              >
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 40px 32px 40px; background-color: #ffffff;">

              <p style="
                margin: 0 0 10px;
                color: #f97316;
                font-size: 11px;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 1.2px;
                text-transform: uppercase;
              ">
                Acompanhamento pós-consulta
              </p>

              <h1 style="
                margin: 0 0 16px;
                color: #111827;
                font-size: 26px;
                line-height: 34px;
                font-weight: 700;
              ">
                Olá, ${patientFirstName} 👋
              </h1>

              <p style="
                margin: 0 0 20px;
                color: #4b5563;
                font-size: 16px;
                line-height: 26px;
              ">
                É hora do <strong>check-in ${checkinNumber}</strong> do seu acompanhamento após a consulta.
                São poucos minutos e ajudam a equipe de saúde a acompanhar sua evolução com segurança.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="
                background-color: #f8fafc;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="margin: 0 0 10px; color: #111827; font-size: 14px; line-height: 22px;">
                      <strong style="color: #374151;">Especialidade:</strong> ${specialtyName}
                    </p>
                    <p style="margin: 0 0 10px; color: #111827; font-size: 14px; line-height: 22px;">
                      <strong style="color: #374151;">Dia do plano:</strong> ${planDayNumber} de ${planTotalDays}
                    </p>
                    <p style="margin: 0 0 10px; color: #111827; font-size: 14px; line-height: 22px;">
                      <strong style="color: #374151;">Check-in:</strong> ${checkinNumber} de ${totalCheckins}
                    </p>
                    <p style="margin: 0; color: #111827; font-size: 14px; line-height: 22px;">
                      <strong style="color: #374151;">Médico(a) responsável:</strong> ${doctorName}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #f97316;">
                    <a
                      href="${checkinUrl}"
                      target="_blank"
                      style="
                        display: inline-block;
                        padding: 16px 32px;
                        font-size: 16px;
                        font-weight: 700;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 12px;
                        line-height: 20px;
                      "
                    >
                      Responder check-in
                    </a>
                  </td>
                </tr>
              </table>

              <p style="
                margin: 0 0 8px;
                color: #6b7280;
                font-size: 13px;
                line-height: 21px;
                text-align: center;
              ">
                ⏱ Este link é válido por <strong>${tokenHours} horas</strong>.
              </p>

              <p style="
                margin: 0 0 24px;
                color: #9ca3af;
                font-size: 12px;
                line-height: 20px;
                text-align: center;
                word-break: break-all;
              ">
                Se o botão não funcionar, copie e cole no navegador:<br>
                <a href="${checkinUrl}" style="color: #2563eb; text-decoration: underline;">
                  ${checkinUrl}
                </a>
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="
                background-color: #fff7ed;
                border: 1px solid #fed7aa;
                border-radius: 12px;
                margin-bottom: 8px;
              ">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 21px;">
                      <strong>Importante:</strong> se você não estiver bem ou tiver piora dos sintomas,
                      procure sua unidade de saúde ou atendimento de urgência — não espere o próximo check-in.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="
              padding: 22px 40px 28px 40px;
              background-color: #f9fafb;
              border-top: 1px solid #eceef1;
            ">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; line-height: 18px; text-align: center;">
                Enviado em ${sentAtLabel} · ${platformName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 17px; text-align: center;">
                Este e-mail é automático. Não responda a esta mensagem.<br>
                Seus dados são tratados conforme a LGPD — uso exclusivo para continuidade do cuidado.
              </p>
            </td>
          </tr>

        </table>

        <p style="margin: 18px 0 0; color: #9ca3af; font-size: 11px; line-height: 16px; text-align: center; max-width: 580px;">
          © ${new Date().getFullYear()} ${platformName} · Farmácia e Telemedicina
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`
}

export function buildPosConsultaCheckinEmailHtml(variables: PosConsultaCheckinEmailVariables): string {
  return buildPosConsultaCheckinEmailHtmlContent(variables).trim()
}

export function buildPosConsultaCheckinEmailText(variables: PosConsultaCheckinEmailVariables): string {
  return [
    `Olá, ${variables.patientFirstName},`,
    '',
    `É hora do check-in ${variables.checkinNumber} do seu acompanhamento pós-consulta.`,
    '',
    `Especialidade: ${variables.specialtyName}`,
    `Dia do plano: ${variables.planDayNumber} de ${variables.planTotalDays}`,
    `Check-in: ${variables.checkinNumber} de ${variables.totalCheckins}`,
    `Médico(a) responsável: ${variables.doctorName}`,
    '',
    `Responder check-in: ${variables.checkinUrl}`,
    '',
    `Link válido por ${POS_CONSULTA_EMAIL_DEFAULTS.token_validade_horas} horas.`,
    '',
    'Importante: se você não estiver bem ou tiver piora dos sintomas, procure sua unidade de saúde ou atendimento de urgência.',
    '',
    `Enviado em ${variables.sentAtLabel} · ${POS_CONSULTA_EMAIL_DEFAULTS.nome_plataforma}`,
  ].join('\n')
}

export function buildPosConsultaCheckinEmailSubject(checkinNumber: number): string {
  return `Telefarmed · Check-in ${checkinNumber} do seu acompanhamento pós-consulta`
}

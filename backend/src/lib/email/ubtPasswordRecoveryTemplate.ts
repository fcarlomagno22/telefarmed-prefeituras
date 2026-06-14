const RECOVERY_CODE_EMAIL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no">
  <title>Recuperação de acesso — Telefarmed</title>
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
    Use o código {{codigo}} para recuperar seu acesso à Telefarmed.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background-color: #f5f6f8;"
  >
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            max-width: 580px;
            background-color: #ffffff;
            border: 1px solid #eceef1;
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 16px 40px rgba(22, 29, 37, 0.08);
          "
        >

          <tr>
            <td
              height="5"
              style="
                height: 5px;
                background-color: #f97316;
                font-size: 0;
                line-height: 0;
              "
            >
              &nbsp;
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding: 30px 36px 24px 36px;
                background-color: #ffffff;
              "
            >
              <img
                src="https://www.telefarmed.com.br/logo_4.png?dpl=dpl_CxfHeaHG8cKm2H49v5o7jdGq66rs"
                alt="Telefarmed"
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
            <td
              align="center"
              style="
                padding: 18px 40px 42px 40px;
                background-color: #ffffff;
              "
            >

              <p style="
                margin: 0;
                color: #f97316;
                font-size: 11px;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 1.2px;
                text-transform: uppercase;
              ">
                Recuperação de acesso
              </p>

              <h1 style="
                margin: 14px 0 12px 0;
                color: #1d222b;
                font-size: 28px;
                line-height: 36px;
                font-weight: 700;
                letter-spacing: -0.6px;
              ">
                Seu código de verificação
              </h1>

              <p style="
                max-width: 430px;
                margin: 0 auto;
                color: #747b87;
                font-size: 15px;
                line-height: 24px;
              ">
                Digite o código abaixo para continuar com a recuperação da sua
                conta Telefarmed.
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top: 30px;"
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 28px 16px;
                      background-color: #fff8f3;
                      border: 1px solid #ffe0c7;
                      border-radius: 18px;
                    "
                  >
                    <div style="
                      color: #e85d04;
                      font-family: 'Courier New', Courier, monospace;
                      font-size: 40px;
                      line-height: 50px;
                      font-weight: 700;
                      letter-spacing: 8px;
                      white-space: nowrap;
                    ">
                      {{codigo}}
                    </div>

                    <p style="
                      margin: 12px 0 0 0;
                      color: #8a5a3b;
                      font-size: 12px;
                      line-height: 18px;
                      font-weight: 700;
                    ">
                      Válido por 15 minutos
                    </p>
                  </td>
                </tr>
              </table>

              <p style="
                margin: 26px 0 0 0;
                color: #737a86;
                font-size: 13px;
                line-height: 21px;
              ">
                Não compartilhe este código com ninguém. A Telefarmed nunca
                solicitará essa informação por telefone, WhatsApp ou mensagem.
              </p>

              <p style="
                margin: 24px 0 0 0;
                padding-top: 22px;
                border-top: 1px solid #eceef1;
                color: #9aa0aa;
                font-size: 12px;
                line-height: 19px;
              ">
                Caso você não tenha solicitado a recuperação, ignore este e-mail.
                Nenhuma alteração será feita em sua conta.
              </p>

            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding: 26px 36px;
                background-color: #171b24;
              "
            >
              <p style="
                margin: 0;
                color: #ffffff;
                font-size: 13px;
                line-height: 20px;
                font-weight: 700;
              ">
                Telefarmed
              </p>

              <p style="
                margin: 4px 0 0 0;
                color: #a4aab5;
                font-size: 11px;
                line-height: 18px;
              ">
                Saúde Conectada
              </p>

              <p style="
                margin: 14px 0 0 0;
                color: #6f7682;
                font-size: 10px;
                line-height: 16px;
              ">
                Esta é uma mensagem automática. Não responda a este e-mail.
              </p>
            </td>
          </tr>

        </table>

        <p style="
          margin: 18px 0 0 0;
          color: #a0a6af;
          font-size: 10px;
          line-height: 16px;
          text-align: center;
        ">
          © {{ano}} Telefarmed. Todos os direitos reservados.
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`

export function buildUbtPasswordRecoveryEmailHtml(code: string): string {
  const year = String(new Date().getFullYear())
  return RECOVERY_CODE_EMAIL_HTML.replaceAll('{{codigo}}', code).replaceAll('{{ano}}', year)
}

export function buildUbtPasswordRecoveryEmailText(code: string): string {
  return [
    'Recuperação de acesso — Telefarmed',
    '',
    `Seu código de verificação: ${code}`,
    '',
    'Digite este código no terminal UBT para continuar com a recuperação da sua conta.',
    'O código é válido por 15 minutos.',
    '',
    'Não compartilhe este código com ninguém.',
    'Se você não solicitou a recuperação, ignore este e-mail.',
  ].join('\n')
}

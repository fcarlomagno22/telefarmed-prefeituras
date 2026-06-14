import nodemailer from 'nodemailer'
import type Transporter from 'nodemailer/lib/mailer/index.js'
import { env } from '../../config/env.js'

let transporter: Transporter | null = null

export function getSmtpTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  }
  return transporter
}

export async function sendMail(input: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const transport = getSmtpTransporter()
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
}

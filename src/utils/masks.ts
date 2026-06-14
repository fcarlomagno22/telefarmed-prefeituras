export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Valor monetário BRL a partir de centavos digitados (ex.: 1990 → R$ 19,90). */
export function maskCurrencyBrl(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''

  const amount = Number(digits) / 100
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function parseCurrencyBrl(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

/** Inteiro com separador de milhares pt-BR (ex.: 5000 → 5.000). */
export function maskIntegerPtBr(value: string, maxDigits = 9): string {
  const digits = value.replace(/\D/g, '').slice(0, maxDigits)
  if (!digits) return ''
  return Number(digits).toLocaleString('pt-BR')
}

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/(\d{5})(\d)/, '$1-$2')
}

/** Máscara dd/mm/aaaa para digitação de data de nascimento. */
export function maskBirthDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** Telefone fixo: (XX) XXXX-XXXX — até 10 dígitos. */
export function maskLandline(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/** Celular: (XX) XXXXX-XXXX — até 11 dígitos. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 10) {
    return maskLandline(value)
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

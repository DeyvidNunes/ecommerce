export function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const MAX_CENTS = 2_147_483_647 // limite de um inteiro de 32 bits no Postgres

// Converte "49,90", "1.234,50" ou "49.9" em centavos, sem usar ponto flutuante
export function parsePriceToCents(input: string): number | null {
  let value = input.replace(/R\$|\s/g, '')
  if (!value) return null

  // Com vírgula: o ponto é separador de milhar. Sem vírgula: o ponto é decimal.
  value = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null

  const [whole, fraction = ''] = value.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))

  return cents >= 1 && cents <= MAX_CENTS ? cents : null
}

// Converte centavos em "49,90" para preencher o campo de edição
export function centsToInput(cents: number) {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`
}
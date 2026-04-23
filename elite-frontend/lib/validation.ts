export function normalizeEthiopianPhone(input: string): string {
  if (!input) return ''
  const trimmed = String(input).trim()
  // remove spaces, dashes, parentheses
  const cleaned = trimmed.replace(/[\s-()]/g, '')

  // If starts with 0 and then 9..., convert to +2519...
  if (/^0?9\d{8}$/.test(cleaned)) {
    // remove leading 0 if present
    const no0 = cleaned.replace(/^0/, '')
    return `+251${no0}`
  }

  // If already +2519XXXXXXXX
  if (/^\+2519\d{8}$/.test(cleaned)) {
    return cleaned
  }

  // If starts with 9XXXXXXXX (9 digits)
  if (/^9\d{8}$/.test(cleaned)) {
    return `+251${cleaned}`
  }

  return cleaned
}

export function isValidEthiopianPhone(input: string): boolean {
  const val = normalizeEthiopianPhone(input)
  return /^\+2519\d{8}$/.test(val)
}

export function isValidPhone(input: string): boolean {
  if (!input) return false
  const cleaned = input.replace(/[\s-()]/g, '')
  return /^\+?[0-9]{7,15}$/.test(cleaned)
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function phoneValidationMessage(input: string | undefined, ethioOnly: boolean = true): string {
  if (!input) return 'Phone is required'
  if (ethioOnly) {
    if (!isValidEthiopianPhone(input)) return 'Invalid Ethiopian phone number'
  } else {
    if (!isValidPhone(input)) return 'Invalid phone number'
  }
  return ''
}

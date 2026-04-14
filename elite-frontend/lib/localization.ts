import { AppLanguage } from '@/lib/i18n'

type AnyRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMaybeJsonObject(value: string): AnyRecord | null {
  const trimmed = value.trim()
  if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function getLocalizedText(value: unknown, language: AppLanguage, fallback = ''): string {
  if (value == null) return fallback

  if (typeof value === 'string') {
    const parsedObject = parseMaybeJsonObject(value)
    if (parsedObject) return getLocalizedText(parsedObject, language, fallback)
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    const firstNonEmpty = value
      .map((item) => getLocalizedText(item, language, ''))
      .find((item) => item.trim().length > 0)
    return firstNonEmpty ?? fallback
  }

  if (isRecord(value)) {
    const direct = value[language]
    const english = value.en
    const firstValue = Object.values(value)[0]

    return (
      getLocalizedText(direct, language, '') ||
      getLocalizedText(english, language, '') ||
      getLocalizedText(firstValue, language, fallback)
    )
  }

  return fallback
}

export function getLocalizedContentText(
  content: Record<string, unknown> | null | undefined,
  key: string,
  language: AppLanguage,
  fallback = ''
): string {
  if (!content) return fallback

  const exact = getLocalizedText(content[key], language, '')
  if (exact) return exact

  const byLang = getLocalizedText(content[`${key}_${language}`], language, '')
  if (byLang) return byLang

  const byEnglish = getLocalizedText(content[`${key}_en`], language, '')
  if (byEnglish) return byEnglish

  return fallback
}

export function getLocalizedStringArray(value: unknown, language: AppLanguage): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => getLocalizedText(item, language, ''))
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  if (isRecord(value)) {
    const text = getLocalizedText(value, language, '')
    if (!text) return []
    return text
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return []
}

export function getLocalizedContentArray(
  content: Record<string, unknown> | null | undefined,
  key: string,
  language: AppLanguage
): string[] {
  if (!content) return []

  const exact = getLocalizedStringArray(content[key], language)
  if (exact.length > 0) return exact

  const byLang = getLocalizedStringArray(content[`${key}_${language}`], language)
  if (byLang.length > 0) return byLang

  return getLocalizedStringArray(content[`${key}_en`], language)
}

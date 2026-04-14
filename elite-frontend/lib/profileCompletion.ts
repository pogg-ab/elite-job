const REQUIRED_DOCUMENT_TYPES = [
  'Passport Copy',
  'Certificates',
  'Training Documents',
  'Profile Photo',
]

export type ProfileCompletionResult = {
  percent: number
  completed: number
  total: number
  missingFields: string[]
  missingDocuments: string[]
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function hasSkills(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

export function calculateProfileCompletion(user: any): ProfileCompletionResult {
  const profile = user?.profile ?? {}

  const checks: Array<{ label: string; done: boolean }> = [
    { label: 'Account name', done: hasText(user?.name) },
    { label: 'Phone', done: hasText(user?.phone) },
    { label: 'Full name', done: hasText(profile?.full_name) },
    { label: 'Gender', done: hasText(profile?.gender) },
    { label: 'Age', done: Boolean(profile?.age) },
    { label: 'Date of birth', done: hasText(profile?.date_of_birth) },
    { label: 'Nationality', done: hasText(profile?.nationality) },
    { label: 'Address', done: hasText(profile?.address) },
    { label: 'Passport status', done: hasText(profile?.passport_status) },
    { label: 'Education', done: hasText(profile?.education_level) },
    { label: 'Work experience', done: hasText(profile?.experience_summary) },
    { label: 'Preferred country', done: hasText(profile?.preferred_country) },
    { label: 'Skills', done: hasSkills(profile?.skills) },
  ]

  const rawDocuments = Array.isArray(user?.documents)
    ? user.documents
    : (Array.isArray(user?.documents?.data) ? user.documents.data : [])

  const uploadedDocTypes = new Set(
    rawDocuments
      .map((d: any) => (typeof d?.document_type === 'string' ? d.document_type : ''))
      .filter((type: string) => type.length > 0)
  )

  const missingDocuments = REQUIRED_DOCUMENT_TYPES.filter((docType) => !uploadedDocTypes.has(docType))

  const total = checks.length + REQUIRED_DOCUMENT_TYPES.length
  const completedFields = checks.filter((item) => item.done).length
  const completedDocuments = REQUIRED_DOCUMENT_TYPES.length - missingDocuments.length
  const completed = completedFields + completedDocuments
  const percent = Math.round((completed / Math.max(total, 1)) * 100)
  const missingFields = checks.filter((item) => !item.done).map((item) => item.label)

  return {
    percent,
    completed,
    total,
    missingFields,
    missingDocuments,
  }
}

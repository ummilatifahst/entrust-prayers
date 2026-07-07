export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function minLen(value: string, n: number): boolean {
  return value.trim().length >= n
}

export interface FieldError {
  [key: string]: string | undefined
}

export function formatDateForInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

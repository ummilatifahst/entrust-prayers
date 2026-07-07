import type { PrayerStatus, PilgrimageStatus, PilgrimageType, UserRole } from '@/types/database'

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(iso)}, ${hh}.${mm}`
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  if (diff < 0) return 'baru saja'
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'baru saja'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} menit lalu`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} jam lalu`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} hari lalu`
  return formatDate(iso)
}

export const PRAYER_STATUS_LABEL: Record<PrayerStatus, string> = {
  pending:   'Menunggu',
  accepted:  'Diterima',
  prayed:    'Sudah Didoakan',
  completed: 'Selesai',
}

export const PRAYER_STATUS_BADGE: Record<PrayerStatus, string> = {
  pending:   'badge-gold',
  accepted:  'badge-blue',
  prayed:    'badge-emerald',
  completed: 'badge-gray',
}

export const PILGRIMAGE_STATUS_LABEL: Record<PilgrimageStatus, string> = {
  draft:    'Draf',
  active:   'Aktif',
  finished: 'Selesai',
}

export const PILGRIMAGE_TYPE_LABEL: Record<PilgrimageType, string> = {
  haji:  'Haji',
  umroh: 'Umroh',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  penitip: 'Penitip Doa',
  pendoa:  'Pendoa',
  admin:   'Admin',
}

export function initials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

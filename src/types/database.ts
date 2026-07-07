// =====================================================================
// Type definitions — mirror DB schema
// =====================================================================

export type UserRole = 'penitip' | 'pendoa' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  city: string
  bio: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type PilgrimageType = 'haji' | 'umroh'
export type PilgrimageStatus = 'draft' | 'active' | 'finished'

export interface Pilgrimage {
  id: string
  user_id: string
  type: PilgrimageType
  departure_date: string
  return_date: string
  description: string
  status: PilgrimageStatus
  created_at: string
  updated_at: string
}

/** Pilgrimage yang sudah di-join dengan data profile pendoa (untuk listing publik) */
export interface PilgrimageWithPendoa extends Pilgrimage {
  pendoa?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'city' | 'bio'>
  prayer_count?: number
}

export type PrayerStatus = 'pending' | 'accepted' | 'prayed' | 'completed'

export interface Prayer {
  id: string
  sender_id: string
  receiver_id: string
  pilgrimage_id: string | null
  title: string
  content: string
  is_private: boolean
  is_anonymous: boolean
  status: PrayerStatus
  prayed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** Prayer yang sudah di-join dengan profile sender/receiver */
export interface PrayerWithRelations extends Prayer {
  sender?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'city'>
  receiver?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'city'>
  pilgrimage?: Pick<Pilgrimage, 'id' | 'type' | 'departure_date' | 'return_date'> | null
}

export type NotificationType =
  | 'info'
  | 'new_prayer'
  | 'prayer_accepted'
  | 'prayer_prayed'
  | 'prayer_completed'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

/** Payload untuk insert prayer baru */
export interface PrayerInput {
  receiver_id: string
  pilgrimage_id: string | null
  title: string
  content: string
  is_private: boolean
  is_anonymous: boolean
}

/** Payload untuk insert pilgrimage baru */
export interface PilgrimageInput {
  type: PilgrimageType
  departure_date: string
  return_date: string
  description: string
  status: PilgrimageStatus
}

/** Payload untuk update profile */
export interface ProfileInput {
  full_name?: string
  avatar_url?: string | null
  city?: string
  bio?: string
}

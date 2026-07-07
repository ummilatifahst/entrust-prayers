import { supabase } from './supabase'
import type {
  Profile,
  Pilgrimage,
  Prayer,
  UserRole,
} from '@/types/database'
import { TABLE } from './constants'

// =====================================================================
// Admin stats
// =====================================================================

export interface AdminStats {
  users: { total: number; penitip: number; pendoa: number; admin: number }
  pilgrimages: { total: number; active: number }
  prayers: {
    total: number
    pending: number
    accepted: number
    prayed: number
    completed: number
  }
  notifications: { total: number }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_stats').single()
  if (error) throw error
  return data as unknown as AdminStats
}

// =====================================================================
// User management
// =====================================================================

export interface AdminUserRow extends Profile {
  prayer_sent_count?: number
  prayer_received_count?: number
}

export async function fetchAllProfiles(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from(TABLE.profiles)
    .select(`
      *,
      prayer_sent_count:prayers!prayers_sender_id_fkey (count),
      prayer_received_count:prayers!prayers_receiver_id_fkey (count)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  // Flatten count dari array [{count: N}] ke number
  return (data ?? []).map((row) => {
    const r = row as unknown as AdminUserRow & {
      prayer_sent_count?: Array<{ count: number }>
      prayer_received_count?: Array<{ count: number }>
    }
    return {
      ...r,
      prayer_sent_count: r.prayer_sent_count?.[0]?.count ?? 0,
      prayer_received_count: r.prayer_received_count?.[0]?.count ?? 0,
    } as AdminUserRow
  })
}

export async function adminSetUserRole(userId: string, newRole: UserRole): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_target_user_id: userId,
    p_new_role: newRole,
  })
  if (error) {
    // Pesan dari RPC sudah Bahasa Indonesia
    throw new Error(error.message)
  }
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', {
    p_target_user_id: userId,
  })
  if (error) throw new Error(error.message)
}

// =====================================================================
// Pilgrimage management (admin bisa kelola semua)
// =====================================================================

export interface AdminPilgrimageRow extends Pilgrimage {
  pendoa?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
  prayer_count?: number
}

export async function fetchAllPilgrimages(): Promise<AdminPilgrimageRow[]> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .select(`
      *,
      pendoa:profiles!pilgrimages_user_id_fkey ( id, full_name, email, avatar_url ),
      prayer_count:prayers(count)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as unknown as AdminPilgrimageRow & { prayer_count?: Array<{ count: number }> }
    return {
      ...r,
      prayer_count: r.prayer_count?.[0]?.count ?? 0,
    } as AdminPilgrimageRow
  })
}

export async function adminDeletePilgrimage(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE.pilgrimages).delete().eq('id', id)
  if (error) throw error
}

export async function adminUpdatePilgrimageStatus(
  id: string,
  status: 'draft' | 'active' | 'finished'
): Promise<void> {
  const { error } = await supabase
    .from(TABLE.pilgrimages)
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

// =====================================================================
// Prayer management (admin bisa kelola semua)
// =====================================================================

export interface AdminPrayerRow extends Prayer {
  sender?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
  receiver?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

export async function fetchAllPrayers(): Promise<AdminPrayerRow[]> {
  const { data, error } = await supabase
    .from(TABLE.prayers)
    .select(`
      *,
      sender:profiles!prayers_sender_id_fkey ( id, full_name, email, avatar_url ),
      receiver:profiles!prayers_receiver_id_fkey ( id, full_name, email, avatar_url )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as AdminPrayerRow[]
}

export async function adminDeletePrayer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE.prayers).delete().eq('id', id)
  if (error) throw error
}

// =====================================================================
// Notification management
// =====================================================================

export async function adminBroadcast(
  title: string,
  message: string,
  type: string = 'info'
): Promise<number> {
  const { data, error } = await supabase.rpc('admin_broadcast_notification', {
    p_title: title,
    p_message: message,
    p_type: type,
  })
  if (error) throw new Error(error.message)
  return data as unknown as number
}

export async function adminSendToUser(
  targetUserId: string,
  title: string,
  message: string,
  type: string = 'info'
): Promise<void> {
  const { error } = await supabase.rpc('admin_send_notification', {
    p_target_user_id: targetUserId,
    p_title: title,
    p_message: message,
    p_type: type,
  })
  if (error) throw new Error(error.message)
}

export async function fetchAllNotifications(): Promise<Array<{
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  user_email?: string
}>> {
  const { data, error } = await supabase
    .from(TABLE.notifications)
    .select(`
      *,
      user:profiles!notifications_user_id_fkey ( email )
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map((n) => {
    const row = n as typeof n & { user?: { email?: string } }
    return {
      ...n,
      user_email: row.user?.email,
    }
  })
}

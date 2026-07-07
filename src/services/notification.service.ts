import { supabase } from './supabase'
import type { AppNotification } from '@/types/database'
import { TABLE } from './constants'

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from(TABLE.notifications)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as AppNotification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE.notifications)
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE.notifications)
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE.notifications)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
}

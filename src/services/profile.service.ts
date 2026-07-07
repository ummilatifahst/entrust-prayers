import { supabase } from './supabase'
import type { Profile, ProfileInput } from '@/types/database'
import { TABLE } from './constants'

export async function fetchProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from(TABLE.profiles)
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfile(userId: string, payload: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE.profiles)
    .update(payload)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

/** Upload avatar ke bucket 'avatars' dengan path {uid}/avatar-{timestamp}.ext */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/avatar-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error

  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path)
  return publicUrl.publicUrl
}

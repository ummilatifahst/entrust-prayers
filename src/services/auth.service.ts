import { supabase } from './supabase'
import type { Profile, UserRole } from '@/types/database'
import { fetchProfileByUserId } from './profile.service'

export interface SignUpPayload {
  email: string
  password: string
  full_name: string
  role: UserRole
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpResult {
  needsEmailConfirm: boolean
  session: boolean
}

/**
 * Daftar user baru. Trigger DB akan auto-create row di tabel profiles.
 * Jika "Confirm email" diaktifkan di Supabase → needsEmailConfirm = true.
 * Jika dimatikan → user langsung punya session, bisa login.
 */
export async function signUp({ email, password, full_name, role }: SignUpPayload): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role, // disimpan ke raw_user_meta_data → dipakai oleh trigger handle_new_user
      },
    },
  })
  if (error) {
    const err = new Error(humanizeAuthError(error)) as Error & { original?: unknown; code?: string }
    err.original = error
    err.code = error.code
    throw err
  }

  // Jika tidak ada user → email sudah dipakai / signup gagal silent
  if (!data.user) {
    const err = new Error('Email sudah terdaftar atau signup gagal. Silakan masuk atau gunakan email lain.') as Error & { code?: string }
    err.code = 'user_already_exists'
    throw err
  }

  return {
    needsEmailConfirm: !data.session, // tidak ada session = perlu konfirmasi email
    session: !!data.session,
  }
}

export async function signIn({ email, password }: SignInPayload) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Bungkus error agar pesan asli dari Supabase terbaca di UI
    const err = new Error(humanizeAuthError(error)) as Error & { original?: unknown }
    err.original = error
    throw err
  }
  return data
}

/** Terjemahkan pesan error Supabase Auth ke Bahasa Indonesia yang user-friendly. */
function humanizeAuthError(e: { code?: string; message?: string }): string {
  const code = e.code ?? ''
  const msg = (e.message ?? '').toLowerCase()

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email atau password salah. Pastikan sudah mendaftar dan mengonfirmasi email.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox Anda untuk tautan verifikasi, atau MATIKAN "Confirm email" di Supabase → Authentication → Providers → Email.'
  }
  if (code === 'over_email_send_rate_limit' || msg.includes('email rate limit')) {
    return 'Batas kirim email Supabase Free Tier terlampaui (maks ~3/jam). Matikan "Confirm email" di Supabase → Authentication → Providers → Email, lalu coba lagi.'
  }
  if (code === 'user_already_exists' || msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.'
  }
  if (code === 'weak_password' || msg.includes('weak password')) {
    return 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf & angka.'
  }
  if (msg.includes('user not found')) return 'Akun tidak ditemukan. Silakan daftar dulu.'
  if (code === 'user_banned' || msg.includes('user is banned')) return 'Akun Anda diblokir.'
  if (code === 'rate_limit_exceeded' || msg.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.'
  }
  if (msg.includes('password')) return 'Password tidak valid.'
  if (msg.includes('network')) return 'Gangguan jaringan. Periksa koneksi Anda.'
  return e.message ?? 'Gagal memproses permintaan'
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data
}

/** Helper: ambil profile lengkap dari user yang sedang login. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return fetchProfileByUserId(user.id)
}

/** Update password change listener */
export function onAuthStateChange(
  callback: (event: string, session: unknown | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import * as authService from '@/services/auth.service'
import { fetchProfileByUserId } from '@/services/profile.service'
import type { Profile, UserRole } from '@/types/database'

export const useAuthStore = defineStore('auth', () => {
  // ---------------- state ----------------
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const initialized = ref(false)

  // ---------------- getters ----------------
  const isAuthenticated = computed(() => !!user.value)
  const role = computed<UserRole | null>(() => profile.value?.role ?? null)
  const isPenitip = computed(() => role.value === 'penitip')
  const isPendoa = computed(() => role.value === 'pendoa')
  const isAdmin = computed(() => role.value === 'admin')
  const displayName = computed(
    () => profile.value?.full_name || user.value?.email?.split('@')[0] || 'Pengguna'
  )

  // ---------------- actions ----------------
  async function init() {
    if (initialized.value) return
    loading.value = true

    const { data: { session: s } } = await supabase.auth.getSession()
    if (s) {
      session.value = s
      user.value = s.user
      await loadProfile()
    }
    loading.value = false
    initialized.value = true

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (newSession?.user) {
        await loadProfile()
      } else {
        profile.value = null
      }
    })
  }

  async function loadProfile() {
    if (!user.value) {
      profile.value = null
      return
    }
    try {
      // Polling sedikit karena trigger membuat profile secara async
      let p = await fetchProfileByUserId(user.value.id)
      let attempts = 0
      while (!p && attempts < 5) {
        await new Promise((r) => setTimeout(r, 300))
        p = await fetchProfileByUserId(user.value.id)
        attempts++
      }
      profile.value = p
    } catch (e) {
      console.error('[auth] gagal load profile:', e)
      profile.value = null
    }
  }

  async function signInWithEmail(email: string, password: string) {
    loading.value = true
    try {
      const data = await authService.signIn({ email, password })
      session.value = data.session
      user.value = data.user
      await loadProfile()
    } finally {
      loading.value = false
    }
  }

  async function signUpWithEmail(payload: authService.SignUpPayload): Promise<authService.SignUpResult> {
    loading.value = true
    try {
      const result = await authService.signUp(payload)
      // Jika Supabase langsung kasih session (Confirm email dimatikan),
      // pakai session tersebut untuk auto-login.
      if (result.session) {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s) {
          session.value = s
          user.value = s.user
          await loadProfile()
        }
      }
      return result
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await authService.signOut()
    session.value = null
    user.value = null
    profile.value = null
  }

  async function refreshProfile() {
    await loadProfile()
  }

  return {
    // state
    user, profile, session, loading, initialized,
    // getters
    isAuthenticated, role, isPenitip, isPendoa, isAdmin, displayName,
    // actions
    init, loadProfile, signInWithEmail, signUpWithEmail, logout, refreshProfile,
  }
})

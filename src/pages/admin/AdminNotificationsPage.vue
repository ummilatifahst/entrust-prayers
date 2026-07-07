<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import {
  adminBroadcast,
  adminSendToUser,
  fetchAllProfiles,
  fetchAllNotifications,
  type AdminUserRow,
} from '@/services/admin.service'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import { timeAgo } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()

type Mode = 'broadcast' | 'single'
const mode = ref<Mode>('broadcast')

const form = reactive({
  title: '',
  message: '',
  type: 'info' as 'info' | 'new_prayer' | 'prayer_accepted' | 'prayer_prayed' | 'prayer_completed',
  targetUserId: '',
})

const sending = ref(false)
const loadingLists = ref(true)
const users = ref<AdminUserRow[]>([])
const notifications = ref<Array<{
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  user_email?: string
}>>([])

async function loadLists() {
  loadingLists.value = true
  try {
    const [u, n] = await Promise.all([fetchAllProfiles(), fetchAllNotifications()])
    users.value = u
    notifications.value = n
  } catch (e) {
    ui.error('Gagal memuat data')
  } finally {
    loadingLists.value = false
  }
}

async function send() {
  if (!form.title.trim() || !form.message.trim()) {
    ui.error('Judul dan pesan wajib diisi')
    return
  }
  if (mode.value === 'single' && !form.targetUserId) {
    ui.error('Pilih user tujuan')
    return
  }
  sending.value = true
  try {
    if (mode.value === 'broadcast') {
      const count = await adminBroadcast(form.title, form.message, form.type)
      ui.success(`Pesan terkirim ke ${count} user`)
    } else {
      await adminSendToUser(form.targetUserId, form.title, form.message, form.type)
      ui.success('Pesan terkirim')
    }
    form.title = ''
    form.message = ''
    form.targetUserId = ''
    await loadLists()
  } catch (e) {
    ui.error((e as Error).message)
  } finally {
    sending.value = false
  }
}

function toneFor(type: string) {
  if (type === 'prayer_prayed' || type === 'prayer_completed') return 'emerald'
  if (type === 'new_prayer') return 'gold'
  if (type === 'prayer_accepted') return 'blue'
  return 'gray'
}

onMounted(async () => {
  await auth.init()
  await loadLists()
})
</script>

<template>
  <div>
    <header class="mb-5">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900 flex items-center gap-2">
        <Icon name="bell" :size="28" />
        Broadcast & Notifikasi
      </h1>
      <p class="text-sm text-emerald-600 mt-1">Kirim pengumuman ke semua user atau ke user tertentu</p>
    </header>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Form kirim -->
      <AppCard padding>
        <!-- Mode toggle -->
        <div class="inline-flex rounded-xl bg-emerald-50 p-1 mb-4">
          <button
            :class="['px-3 py-1.5 text-sm rounded-lg transition', mode === 'broadcast' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700']"
            @click="mode = 'broadcast'"
          >
            Broadcast (Semua)
          </button>
          <button
            :class="['px-3 py-1.5 text-sm rounded-lg transition', mode === 'single' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700']"
            @click="mode = 'single'"
          >
            Ke 1 User
          </button>
        </div>

        <div class="space-y-4">
          <div v-if="mode === 'single'">
            <label class="form-label">User Tujuan</label>
            <select v-model="form.targetUserId" class="form-input">
              <option value="">— Pilih User —</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.full_name }} ({{ u.email }}) · {{ u.role }}
              </option>
            </select>
          </div>

          <AppInput
            v-model="form.title"
            label="Judul"
            placeholder="Misal: Pengumuman Maintenance"
            required
            :maxlength="100"
          />

          <AppTextarea
            v-model="form.message"
            label="Pesan"
            placeholder="Tulis isi pesan..."
            :rows="5"
            :maxlength="500"
            required
          />

          <div>
            <label class="form-label">Tipe Notifikasi</label>
            <select v-model="form.type" class="form-input">
              <option value="info">Info Umum</option>
              <option value="new_prayer">Doa Baru</option>
              <option value="prayer_accepted">Doa Diterima</option>
              <option value="prayer_prayed">Doa Sudah Didoakan</option>
              <option value="prayer_completed">Doa Selesai</option>
            </select>
          </div>

          <div class="flex justify-end">
            <AppButton variant="primary" size="lg" :loading="sending" @click="send">
              <Icon name="send" :size="16" />
              {{ mode === 'broadcast' ? 'Kirim ke Semua' : 'Kirim' }}
            </AppButton>
          </div>
        </div>
      </AppCard>

      <!-- Riwayat notifikasi -->
      <AppCard padding>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-emerald-900">Riwayat Terbaru</h2>
          <AppBadge tone="gray">{{ notifications.length }} terbaru</AppBadge>
        </div>

        <div v-if="loadingLists" class="py-4"><Spinner /></div>

        <div v-else-if="notifications.length === 0" class="text-center py-8 text-emerald-600 text-sm">
          Belum ada notifikasi terkirim.
        </div>

        <ul v-else class="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          <li
            v-for="n in notifications"
            :key="n.id"
            class="p-3 rounded-xl border border-emerald-50 hover:bg-emerald-50/40"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <AppBadge :tone="toneFor(n.type)">{{ n.type }}</AppBadge>
              <span class="text-xs text-emerald-500">{{ timeAgo(n.created_at) }}</span>
            </div>
            <p class="text-sm font-semibold text-emerald-900 truncate">{{ n.title }}</p>
            <p class="text-xs text-emerald-700 line-clamp-2">{{ n.message }}</p>
            <p class="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <Icon name="user" :size="10" />
              Ke: {{ n.user_email ?? n.user_id }}
              <span v-if="!n.is_read" class="ml-2 text-emerald-700">· Belum dibaca</span>
            </p>
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

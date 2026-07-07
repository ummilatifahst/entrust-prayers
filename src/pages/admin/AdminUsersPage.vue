<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import {
  fetchAllProfiles,
  adminSetUserRole,
  adminDeleteUser,
  type AdminUserRow,
} from '@/services/admin.service'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import type { UserRole } from '@/types/database'
import { formatDate, ROLE_LABEL } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const users = ref<AdminUserRow[]>([])
const search = ref('')
const filterRole = ref<UserRole | 'all'>('all')

const toDelete = ref<AdminUserRow | null>(null)
const showDelete = ref(false)
const roleChanging = ref<string | null>(null)

const filtered = computed(() => {
  let list = users.value
  if (filterRole.value !== 'all') {
    list = list.filter((u) => u.role === filterRole.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((u) =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

async function load() {
  loading.value = true
  try {
    users.value = await fetchAllProfiles()
  } catch (e) {
    ui.error('Gagal memuat data user')
  } finally {
    loading.value = false
  }
}

async function changeRole(user: AdminUserRow, newRole: UserRole) {
  if (user.role === newRole) return
  roleChanging.value = user.id
  try {
    await adminSetUserRole(user.id, newRole)
    user.role = newRole
    ui.success(`Role ${user.full_name} diubah menjadi ${ROLE_LABEL[newRole]}`)
  } catch (e) {
    ui.error((e as Error).message)
  } finally {
    roleChanging.value = null
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await adminDeleteUser(toDelete.value.id)
    users.value = users.value.filter((u) => u.id !== toDelete.value!.id)
    ui.success('User dihapus.')
    showDelete.value = false
    toDelete.value = null
  } catch (e) {
    ui.error((e as Error).message)
  }
}

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div>
    <header class="mb-5">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900 flex items-center gap-2">
        <Icon name="users" :size="28" />
        Kelola User
      </h1>
      <p class="text-sm text-emerald-600 mt-1">Ubah role atau hapus user dari sistem</p>
    </header>

    <!-- Filter & search -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="flex-1">
        <AppInput v-model="search" placeholder="Cari nama, email, atau kota...">
          <template #prefix><Icon name="users" :size="16" /></template>
        </AppInput>
      </div>
      <div class="inline-flex rounded-xl bg-white border border-emerald-200 p-1 self-start overflow-x-auto">
        <button
          v-for="opt in [
            { v: 'all', l: 'Semua' },
            { v: 'penitip', l: 'Penitip' },
            { v: 'pendoa', l: 'Pendoa' },
            { v: 'admin', l: 'Admin' },
          ]"
          :key="opt.v"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition',
            filterRole === opt.v ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50',
          ]"
          @click="filterRole = opt.v as UserRole | 'all'"
        >
          {{ opt.l }}
        </button>
      </div>
    </div>

    <AppCard v-if="loading" padding><Spinner size="lg" /></AppCard>

    <AppCard v-else-if="filtered.length === 0" padding>
      <EmptyState icon="👥" title="Tidak ada user" />
    </AppCard>

    <!-- Table for desktop -->
    <AppCard v-else padding class="!p-0 overflow-hidden hidden lg:block">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-emerald-50/80 text-emerald-700 border-b border-emerald-100">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">User</th>
              <th class="text-left px-4 py-3 font-semibold">Role</th>
              <th class="text-left px-4 py-3 font-semibold">Aktivitas</th>
              <th class="text-left px-4 py-3 font-semibold">Bergabung</th>
              <th class="text-right px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-emerald-50">
            <tr v-for="u in filtered" :key="u.id" class="hover:bg-emerald-50/40">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <AppAvatar :name="u.full_name" :src="u.avatar_url" size="md" />
                  <div class="min-w-0">
                    <p class="font-semibold text-emerald-900 truncate">
                      {{ u.full_name || '(tanpa nama)' }}
                      <AppBadge v-if="u.id === auth.user?.id" tone="gold" class="ml-1">Anda</AppBadge>
                    </p>
                    <p class="text-xs text-emerald-600 truncate">{{ u.email }}</p>
                    <p v-if="u.city" class="text-xs text-emerald-500">{{ u.city }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <select
                  :value="u.role"
                  :disabled="u.id === auth.user?.id || roleChanging === u.id"
                  :class="[
                    'text-xs rounded-lg border-emerald-200 px-2 py-1.5 font-medium',
                    u.id === auth.user?.id ? 'bg-emerald-50 text-emerald-500 cursor-not-allowed' : '',
                  ]"
                  @change="changeRole(u, ($event.target as HTMLSelectElement).value as UserRole)"
                >
                  <option value="penitip">Penitip</option>
                  <option value="pendoa">Pendoa</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="px-4 py-3 text-xs text-emerald-700">
                <div>Kirim: <strong>{{ u.prayer_sent_count ?? 0 }}</strong> doa</div>
                <div>Terima: <strong>{{ u.prayer_received_count ?? 0 }}</strong> doa</div>
              </td>
              <td class="px-4 py-3 text-xs text-emerald-600">
                {{ formatDate(u.created_at) }}
              </td>
              <td class="px-4 py-3 text-right">
                <AppButton
                  variant="danger"
                  size="sm"
                  :disabled="u.id === auth.user?.id"
                  @click="toDelete = u; showDelete = true"
                >
                  <Icon name="trash" :size="14" />
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- Cards for mobile -->
    <div class="lg:hidden space-y-3">
      <AppCard v-for="u in filtered" :key="u.id" padding>
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <AppAvatar :name="u.full_name" :src="u.avatar_url" size="md" />
            <div class="min-w-0">
              <p class="font-semibold text-emerald-900 truncate">
                {{ u.full_name || '(tanpa nama)' }}
              </p>
              <p class="text-xs text-emerald-600 truncate">{{ u.email }}</p>
            </div>
          </div>
          <AppBadge v-if="u.id === auth.user?.id" tone="gold">Anda</AppBadge>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs mb-3">
          <div class="bg-emerald-50/60 rounded-lg p-2">
            <p class="text-emerald-600">Mengirim</p>
            <p class="font-bold text-emerald-900">{{ u.prayer_sent_count ?? 0 }} doa</p>
          </div>
          <div class="bg-emerald-50/60 rounded-lg p-2">
            <p class="text-emerald-600">Menerima</p>
            <p class="font-bold text-emerald-900">{{ u.prayer_received_count ?? 0 }} doa</p>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <select
            :value="u.role"
            :disabled="u.id === auth.user?.id"
            class="text-sm rounded-lg border-emerald-200 px-3 py-2 flex-1"
            @change="changeRole(u, ($event.target as HTMLSelectElement).value as UserRole)"
          >
            <option value="penitip">Penitip</option>
            <option value="pendoa">Pendoa</option>
            <option value="admin">Admin</option>
          </select>
          <AppButton
            variant="danger"
            size="sm"
            :disabled="u.id === auth.user?.id"
            @click="toDelete = u; showDelete = true"
          >
            <Icon name="trash" :size="14" />
          </AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Delete modal -->
    <AppModal v-model="showDelete" title="Hapus User" size="sm">
      <p class="text-sm text-emerald-700">
        Yakin ingin menghapus user ini? Semua data terkait (profile, doa, perjalanan) akan ikut terhapus.
      </p>
      <div v-if="toDelete" class="mt-3 p-3 bg-red-50 rounded-lg text-sm">
        <p class="font-semibold text-red-800">{{ toDelete.full_name || '(tanpa nama)' }}</p>
        <p class="text-red-600">{{ toDelete.email }}</p>
      </div>
      <template #footer>
        <AppButton variant="ghost" @click="showDelete = false">Batal</AppButton>
        <AppButton variant="danger" @click="confirmDelete">
          <Icon name="trash" :size="14" />
          Hapus Permanen
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

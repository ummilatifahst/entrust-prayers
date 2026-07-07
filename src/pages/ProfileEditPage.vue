<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { updateProfile, uploadAvatar } from '@/services/profile.service'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const ui = useUiStore()

const form = reactive({
  full_name: '',
  city: '',
  bio: '',
})
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const loading = ref(false)

onMounted(async () => {
  await auth.init()
  if (auth.profile) {
    form.full_name = auth.profile.full_name
    form.city = auth.profile.city
    form.bio = auth.profile.bio
    avatarPreview.value = auth.profile.avatar_url
  }
})

function onPickAvatar() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const f = (e.target as HTMLInputElement).files?.[0]
    if (!f) return
    avatarFile.value = f
    avatarPreview.value = URL.createObjectURL(f)
  }
  input.click()
}

async function save() {
  if (!auth.user) return
  loading.value = true
  try {
    let avatar_url = auth.profile?.avatar_url ?? null
    if (avatarFile.value) {
      avatar_url = await uploadAvatar(auth.user.id, avatarFile.value)
    }
    await updateProfile(auth.user.id, {
      full_name: form.full_name,
      city: form.city,
      bio: form.bio,
      avatar_url,
    })
    await auth.refreshProfile()
    ui.success('Profil berhasil disimpan!')
    avatarFile.value = null
  } catch (e) {
    const err = e as { message?: string }
    ui.error(err.message ?? 'Gagal menyimpan profil')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-display font-bold text-emerald-900">Profil Saya</h1>
      <p class="text-sm text-emerald-600">Kelola informasi profil yang ditampilkan ke pengguna lain</p>
    </header>

    <div class="card space-y-5">
      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <AppAvatar :name="form.full_name" :src="avatarPreview" size="xl" />
        <div>
          <AppButton variant="secondary" size="sm" @click="onPickAvatar">
            <Icon name="edit" :size="14" />
            Ganti Foto
          </AppButton>
          <p class="form-hint mt-1.5">JPG, PNG. Maks 2MB.</p>
        </div>
      </div>

      <hr class="border-emerald-100" />

      <AppInput v-model="form.full_name" label="Nama Lengkap" placeholder="Nama Anda" />
      <AppInput v-model="form.city" label="Kota Asal" placeholder="Jakarta, Indonesia" />

      <AppTextarea
        v-model="form.bio"
        label="Bio Singkat"
        placeholder="Ceritakan sedikit tentang Anda..."
        :rows="4"
        :maxlength="200"
      />

      <div class="bg-emerald-50/60 rounded-xl p-3 flex items-center gap-3 text-sm text-emerald-700">
        <Icon name="shield" :size="16" class="flex-shrink-0" />
        <span>Email: <strong>{{ auth.user?.email }}</strong> · Role: <strong class="capitalize">{{ auth.role }}</strong></span>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" @click="$router.back()">Batal</AppButton>
        <AppButton variant="primary" :loading="loading" @click="save">
          <Icon name="check-circle" :size="16" />
          Simpan Perubahan
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layouts/AppHeader.vue'
import AppSidebar from '@/components/layouts/AppSidebar.vue'

const router = useRouter()
const sidebarOpen = ref(false)

router.afterEach(() => { sidebarOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-emerald-50/40 bg-pattern-islamic">
    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class="flex">
      <!-- Sidebar desktop -->
      <aside class="hidden lg:block w-64 flex-shrink-0 border-r border-emerald-100 bg-white/70 backdrop-blur-sm min-h-[calc(100vh-4rem)] sticky top-16 self-start">
        <AppSidebar />
      </aside>

      <!-- Sidebar mobile -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-150"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <aside v-if="sidebarOpen" class="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            <div class="flex items-center justify-between px-4 h-16 border-b border-emerald-100">
              <span class="font-display font-bold text-emerald-700">Menu</span>
              <button @click="sidebarOpen = false" class="text-emerald-600">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>
            <AppSidebar />
          </aside>
        </Transition>
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 bg-emerald-950/40 z-40 lg:hidden"
          @click="sidebarOpen = false"
        />
      </Teleport>

      <main class="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
        <div class="container-page py-6 sm:py-8 animate-fade-in">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'
export interface Toast {
  id: number
  type: ToastType
  message: string
  timeoutMs?: number
}

let _id = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])

  function push(message: string, type: ToastType = 'info', timeoutMs = 3500) {
    const id = ++_id
    toasts.value.push({ id, message, type, timeoutMs })
    if (timeoutMs > 0) {
      setTimeout(() => dismiss(id), timeoutMs)
    }
    return id
  }

  function success(message: string) { return push(message, 'success') }
  function error(message: string)   { return push(message, 'error', 5000) }
  function info(message: string)    { return push(message, 'info') }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, push, success, error, info, dismiss }
})

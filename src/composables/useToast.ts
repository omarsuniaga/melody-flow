import { ref } from 'vue'

interface Toast {
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function useToast() {
  const toast = ref<Toast | null>(null)
  const timeoutId = ref<NodeJS.Timeout>()

  const showToast = (message: string, type: Toast['type'], duration = 3000) => {
    if (timeoutId.value) clearTimeout(timeoutId.value)
    toast.value = { message, type }
    
    timeoutId.value = setTimeout(() => {
      toast.value = null
    }, duration)
  }

  const success = (message: string) => showToast(message, 'success')
  const error = (message: string) => showToast(message, 'error')
  const warning = (message: string) => showToast(message, 'warning')

  return {
    toast,
    success,
    error,
    warning
  }
}

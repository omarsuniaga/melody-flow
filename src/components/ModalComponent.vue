<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    @keydown.esc="close"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      aria-hidden="true"
      @click="close"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div
        ref="modalRef"
        class="relative w-full transform overflow-hidden rounded-lg bg-white p-4 sm:p-6 text-left shadow-xl transition-all"
        :class="[
          $slots.default ? modelClass : 'max-w-lg',
          { 'animate-modal-open': modelValue }
        ]"
        tabindex="-1"
      >
        <!-- Close button -->
        <button
          class="absolute right-4 top-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="close"
          aria-label="Close modal"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Title -->
        <div v-if="title" class="mb-4">
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            {{ title }}
          </h3>
        </div>

        <!-- Content -->
        <div class="mt-2">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="mt-4 flex justify-end gap-3">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { PropType } from 'vue' // Asegúrate de que Vue 3 esté correctamente instalado

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: (String as unknown) as PropType<string | undefined>, // Ajusta la definición del tipo
    required: false
  },
  modelClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modalRef = ref<HTMLElement | null>(null)
const previousActiveElement = ref<HTMLElement | null>(null)

const close = () => {
  emit('update:modelValue', false)
}

// Focus trap
const handleTab = (e: KeyboardEvent) => {
  if (!modalRef.value) return

  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstFocusable = focusableElements[0] as HTMLElement
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      lastFocusable.focus()
      e.preventDefault()
    }
  } else {
    if (document.activeElement === lastFocusable) {
      firstFocusable.focus()
      e.preventDefault()
    }
  }
}

// Manage focus and scroll lock
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    previousActiveElement.value = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      modalRef.value?.focus()
    })
  } else {
    document.body.style.overflow = ''
    previousActiveElement.value?.focus()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleTab)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleTab)
  document.body.style.overflow = ''
})

// Añadir nombre y exportación del componente
defineOptions({
  name: 'ModalComponent'
})
</script>

<script lang="ts">
export default {
  name: 'ModalComponent'
}
</script>

<style>
.animate-modal-open {
  animation: modal-open 0.3s ease-out;
}

@keyframes modal-open {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Mejoras responsive */
@media (max-width: 640px) {
  .modal-content {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
    padding: 1rem;
  }
}
</style>

<template>
  <div class="relative" @keydown.esc="close">
    <!-- Trigger button -->
    <button
      ref="triggerRef"
      type="button"
      class="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
    >
      <slot name="trigger"></slot>
    </button>

    <!-- Dropdown menu -->
    <div
      v-show="isOpen"
      ref="menuRef"
      class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      :aria-labelledby="id"
      @click.stop
    >
      <div class="py-1" role="none">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEventListener } from '@vueuse/core'

const props = defineProps<{
  id: string
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

// Close when clicking outside
useEventListener(document, 'click', (event: Event) => {
  const target = event.target as HTMLElement
  if (!triggerRef.value?.contains(target) && !menuRef.value?.contains(target)) {
    close()
  }
})

// Handle keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isOpen.value) return

  const menuItems = menuRef.value?.querySelectorAll('[role="menuitem"]')
  if (!menuItems?.length) return

  const currentIndex = Array.from(menuItems).indexOf(document.activeElement as Element)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (currentIndex === menuItems.length - 1) {
        ;(menuItems[0] as HTMLElement).focus()
      } else {
        ;(menuItems[currentIndex + 1] as HTMLElement).focus()
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (currentIndex === 0) {
        ;(menuItems[menuItems.length - 1] as HTMLElement).focus()
      } else {
        ;(menuItems[currentIndex - 1] as HTMLElement).focus()
      }
      break
    case 'Home':
      event.preventDefault()
      ;(menuItems[0] as HTMLElement).focus()
      break
    case 'End':
      event.preventDefault()
      ;(menuItems[menuItems.length - 1] as HTMLElement).focus()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
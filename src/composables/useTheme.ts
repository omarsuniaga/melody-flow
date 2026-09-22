import { ref, watch } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

// Apply persisted theme on load
if (isDark.value) {
  document.documentElement.classList.add('dark')
}

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
  }

  watch(isDark, (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  })

  return { isDark, toggleTheme }
}

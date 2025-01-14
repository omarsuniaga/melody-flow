<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex">
            <router-link
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
              :class="{ 'text-blue-600': isCurrentRoute(link.path) }"
            >
              {{ link.name }}
            </router-link>
          </div>
          <div class="flex items-center">
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 px-4">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()

const navLinks = ref([
  { path: '/calendar', name: 'Calendar' },
  { path: '/monthly-balance', name: 'Monthly Balance' },
  { path: '/profile', name: 'Profile' }
])

function isCurrentRoute(path: string): boolean {
  return route.path === path
}

function handleLogout() {
  localStorage.removeItem('userToken')
  router.push('/login')
}
</script>

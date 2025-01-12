<template>
  <div class="min-h-screen p-4">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>

        <!-- Password Management -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Password Management</h3>
          <form @submit.prevent="updateUserPassword" class="space-y-4">
            <div>
              <label for="currentPassword" class="label">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                class="input"
                required
              />
            </div>
            <div>
              <label for="newPassword" class="label">New Password</label>
              <input
                type="password"
                id="newPassword"
                v-model="passwordForm.newPassword"
                class="input"
                required
              />
            </div>
            <div>
              <label for="confirmPassword" class="label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                class="input"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </form>
        </div>

        <!-- Currency Settings -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Currency Settings</h3>
          <form @submit.prevent="updateCurrencySettings" class="space-y-4">
            <div>
              <label for="exchangeRate" class="label">USD to DOP Exchange Rate</label>
              <input
                type="number"
                id="exchangeRate"
                v-model="currencySettings.exchangeRate"
                class="input"
                step="0.01"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary">Update Exchange Rate</button>
          </form>
        </div>

        <!-- Notification Preferences -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>

          <!-- Sound Alerts -->
          <div class="mb-4">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="notificationSettings.soundEnabled"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Sound Alerts</span>
            </label>
          </div>

          <!-- Push Notifications -->
          <div class="mb-4">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="notificationSettings.pushEnabled"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Push Notifications</span>
            </label>
          </div>

          <!-- Alert Times -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">Alert Times</h4>
            <div
              v-for="(alert, index) in notificationSettings.alertTimes"
              :key="index"
              class="flex items-center space-x-2"
            >
              <input type="time" v-model="alert.time" class="input" />
              <button @click="removeAlertTime(index)" class="text-red-600">
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
            <button @click="addAlertTime" class="btn btn-secondary">Add Alert Time</button>
          </div>

          <!-- Audio File Selection -->
          <div class="mb-4">
            <label class="block text-gray-700">Select Notification Sound</label>
            <input type="file" @change="handleAudioFileChange" accept="audio/*" class="mt-2" />
          </div>
        </div>

        <!-- Session Management -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
          <div class="space-y-4">
            <div>
              <label for="sessionTimeout" class="label">Session Timeout (minutes)</label>
              <input
                type="number"
                id="sessionTimeout"
                v-model="sessionSettings.timeoutMinutes"
                class="input"
                min="5"
                step="5"
              />
            </div>
              <button
                @click="logout"
                class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon class="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </button>
            <div class="mb-10">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { auth } from '../firebase/config'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useNotificationStore } from '../stores/notificationStore'
import { useAlertSystem } from '../composables/useAlertSystem'
import { NotificationService } from '../services/notificationService'

const router = useRouter()
const notificationStore = useNotificationStore()
const { requestNotificationPermission } = useAlertSystem()

// Reactive references
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const currencySettings = ref({
  exchangeRate: 60,
})

const notificationSettings = ref(notificationStore.settings)

const sessionSettings = ref({
  timeoutMinutes: 30,
})

// Interval reference
let checkInterval: number | undefined

// Lifecycle hooks
onMounted(() => {
  try {
    NotificationService.requestPermission()
    checkInterval = window.setInterval(checkTime, 60000) // Check every minute
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})

// Functions
function checkTime() {
  try {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    notificationSettings.value.alertTimes.forEach(alert => {
      if (alert.time === currentTime) {
        NotificationService.notifyUpcomingEvents()
      }
    })
  } catch (error) {
    console.error('Error in checkTime:', error)
  }
}

async function updateUserPassword() {
  if (!auth.currentUser?.email) return

  try {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      passwordForm.value.currentPassword,
    )

    await reauthenticateWithCredential(auth.currentUser, credential)
    await updatePassword(auth.currentUser, passwordForm.value.newPassword)

    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    alert('Password updated successfully')
  } catch (error) {
    console.error('Error updating password:', error)
    alert('Failed to update password')
  }
}

function updateCurrencySettings() {
  // TODO: Implement currency settings update
  alert('Currency settings updated')
}

async function updateNotificationSettings() {
  try {
    if (notificationSettings.value.pushEnabled) {
      const permitted = await requestNotificationPermission()
      if (!permitted) {
        notificationSettings.value.pushEnabled = false
        alert('Notification permission denied')
        return
      }
    }
    notificationStore.updateSettings(notificationSettings.value)
  } catch (error) {
    console.error('Error updating notification settings:', error)
  }
}

function addAlertTime() {
  notificationSettings.value.alertTimes.push({ time: '12:00' })
  updateNotificationSettings()
}

function removeAlertTime(index: number) {
  notificationSettings.value.alertTimes.splice(index, 1)
  updateNotificationSettings()
}

async function logout() {
  try {
    await auth.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

function handleAudioFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    NotificationService.setAudioFile(file)
  }
}
</script>

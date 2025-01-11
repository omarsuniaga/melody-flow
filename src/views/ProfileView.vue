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
            <div v-for="(alert, index) in notificationSettings.alertTimes"
              :key="index"
              class="flex items-center space-x-2"
            >
              <input
                type="time"
                v-model="alert.time"
                class="input"
              />
              <button @click="removeAlertTime(index)" class="text-red-600">
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
            <button @click="addAlertTime" class="btn btn-secondary">
              Add Alert Time
            </button>
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
            <button @click="logout" class="btn btn-primary bg-red-600 hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { TrashIcon } from '@heroicons/vue/24/outline' // or /solid
import { auth } from '../firebase/config'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'

const router = useRouter()

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const currencySettings = ref({
  exchangeRate: 60
})

const notificationSettings = ref({
  soundEnabled: true,
  pushEnabled: true,
  alertTimes: [
    { time: '10:00' },
    { time: '12:00' },
    { time: '17:00' }
  ]
})

const sessionSettings = ref({
  timeoutMinutes: 30
})

async function updateUserPassword() {
  if (!auth.currentUser?.email) return

  try {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      passwordForm.value.currentPassword
    )

    await reauthenticateWithCredential(auth.currentUser, credential)
    await updatePassword(auth.currentUser, passwordForm.value.newPassword)

    // Reset form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
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

function addAlertTime() {
  notificationSettings.value.alertTimes.push({ time: '12:00' })
}

function removeAlertTime(index) {
  notificationSettings.value.alertTimes.splice(index, 1)
}

async function logout() {
  try {
    await auth.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

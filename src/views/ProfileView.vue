<template>
  <div class="min-h-screen p-2 sm:p-4">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <div class="flex items-center gap-2 mb-6">
          <UserCircleIcon class="h-8 w-8 text-blue-600" />
          <h2 class="text-2xl font-bold text-gray-800">Configuración de Perfil</h2>
        </div>

        <!-- Secciones Colapsables -->
        <div class="space-y-4">
          <!-- Gestión de Contraseña -->
          <div class="border rounded-lg overflow-hidden">
            <button
              @click="toggleSection('password')"
              class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
            >
              <h3 class="text-lg font-medium text-gray-900">Gestión de Contraseña</h3>
              <ChevronDownIcon
                :class="['h-5 w-5 transition-transform', sections.password ? 'transform rotate-180' : '']"
              />
            </button>
            <div v-show="sections.password" class="p-4">
              <form @submit.prevent="updateUserPassword" class="space-y-4">
                <div>
                  <label for="currentPassword" class="label">Contraseña Actual</label>
                  <input
                    type="password"
                    id="currentPassword"
                    v-model="passwordForm.currentPassword"
                    class="input"
                    required
                  />
                </div>
                <div>
                  <label for="newPassword" class="label">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    class="input"
                    required
                  />
                </div>
                <div>
                  <label for="confirmPassword" class="label">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword"
                    class="input"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-primary">Actualizar Contraseña</button>
              </form>
            </div>
          </div>

          <!-- Configuración de Moneda -->
          <div class="border rounded-lg overflow-hidden">
            <button
              @click="toggleSection('currency')"
              class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
            >
              <h3 class="text-lg font-medium text-gray-900">Configuración de Moneda</h3>
              <ChevronDownIcon
                :class="['h-5 w-5 transition-transform', sections.currency ? 'transform rotate-180' : '']"
              />
            </button>
            <div v-show="sections.currency" class="p-4">
              <!-- Moneda Nativa -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium">Moneda Local/Nativa</h4>
                <div class="flex items-center gap-4">
                  <div class="relative flex-1">
                    <input
                      v-model="localCurrencyCode"
                      class="input uppercase"
                      maxlength="3"
                      placeholder="DOP"
                    />
                  </div>
                  <div class="text-2xl" v-if="localCurrencyCode">
                    {{ currencyStore.getFlagEmoji(localCurrencyCode) }}
                  </div>
                </div>
              </div>

              <!-- Moneda Extranjera -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium">Moneda Extranjera</h4>
                <div class="flex items-center gap-4">
                  <div class="relative flex-1">
                    <input
                      v-model="foreignCurrencyCode"
                      class="input uppercase"
                      maxlength="3"
                      placeholder="USD"
                    />
                  </div>
                  <div class="text-2xl" v-if="foreignCurrencyCode">
                    {{ currencyStore.getFlagEmoji(foreignCurrencyCode) }}
                  </div>
                </div>
              </div>

              <!-- Tasa de Cambio -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium">Tasa de Cambio</h4>
                  <button
                    @click="updateExchangeRate"
                    class="btn btn-secondary flex items-center gap-2"
                    :disabled="currencyStore.isLoading"
                  >
                    <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': currencyStore.isLoading }" />
                    Actualizar Tasa
                  </button>
                </div>
                <div class="text-sm text-gray-500">
                  Última actualización: {{ currencyStore.formattedLastUpdate }}
                </div>
                <div class="flex items-center gap-2">
                  <span>1 {{ currencyStore.settings.foreignCurrency.code }} =</span>
                  <input
                    v-model.number="currencyStore.settings.exchangeRate"
                    type="number"
                    class="input w-32"
                    min="0"
                    step="0.01"
                  />
                  <span>{{ currencyStore.settings.nativeCurrency.code }}</span>
                </div>
              </div>

              <!-- Calculadora de Cambio -->
              <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-medium mb-4">Calculadora de Cambio</h4>
                <div class="flex items-center gap-4">
                  <input
                    v-model.number="calculatorAmount"
                    type="number"
                    class="input w-32"
                    min="0"
                    step="0.01"
                  />
                  <select v-model="calculatorCurrency" class="input w-32">
                    <option :value="currencyStore.settings.nativeCurrency.code">
                      {{ currencyStore.settings.nativeCurrency.flag }} {{ currencyStore.settings.nativeCurrency.code }}
                    </option>
                    <option :value="currencyStore.settings.foreignCurrency.code">
                      {{ currencyStore.settings.foreignCurrency.flag }} {{ currencyStore.settings.foreignCurrency.code }}
                    </option>
                  </select>
                  <span>=</span>
                  <div class="font-medium">
                    {{ formatConvertedAmount(calculatorAmount, calculatorCurrency) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Preferencias de Notificaciones -->
          <div class="border rounded-lg overflow-hidden">
            <button
              @click="toggleSection('notifications')"
              class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
            >
              <h3 class="text-lg font-medium text-gray-900">Preferencias de Notificaciones</h3>
              <ChevronDownIcon
                :class="['h-5 w-5 transition-transform', sections.notifications ? 'transform rotate-180' : '']"
              />
            </button>
            <div v-show="sections.notifications" class="p-4 max-h-[70vh] overflow-y-auto">
              <!-- Configuración General -->
              <div class="space-y-4 mb-6">
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.sound"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Activar Sonidos</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.vibration"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Activar Vibración</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.screen"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Activar Pantalla en Alerta</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.led"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Activar Notificaciones LED</span>
                </label>
              </div>

              <!-- Configuración de Tiempos de Alerta -->
              <div class="space-y-4">
                <!-- Configuración de Alarma Final -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700">
                    Alarma Final (minutos antes del evento)
                  </label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      v-model="finalAlertMinutes"
                      class="input w-24"
                      min="15"
                      step="15"
                    />
                    <button
                      @click="updateFinalAlert"
                      class="btn btn-secondary"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>

                <!-- Configuración de Alertas Tempranas -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700">
                    Agregar Alerta (horas antes del evento)
                  </label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      v-model="newAlertHours"
                      class="input w-24"
                      min="1"
                      step="1"
                    />
                    <button
                      @click="addNewAlert"
                      class="btn btn-secondary"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                <!-- Lista de Alertas Actuales -->
                <div class="space-y-2">
                  <h4 class="font-medium text-gray-700">Alertas Configuradas</h4>
                  <div v-for="alert in sortedAlerts" :key="alert.minutes"
                       class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>
                      {{ formatAlertTime(alert.minutes) }}
                      <span v-if="alert.type === 'final'" class="text-red-600 ml-2">
                        (Alarma Final)
                      </span>
                    </span>
                    <button
                      v-if="alert.type !== 'final'"
                      @click="removeAlert(alert.minutes)"
                      class="text-red-600"
                    >
                      <TrashIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cerrar Sesión -->
        <div class="mt-6">
          <button
            @click="logout"
            class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useCurrencyStore } from '../stores/currencyStore'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase/config'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useNotificationStore } from '../stores/notificationStore'
import { NotificationService } from '../services/NotificationService'
import { useSettingsStore } from '../stores/settingsStore'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { UserCircleIcon } from '@heroicons/vue/24/outline'

type Sections = {
  password: boolean;
  currency: boolean;
  notifications: boolean;
}


// Estado para secciones colapsables
const sections = ref<Sections>({
  password: false,
  currency: false,
  notifications: true // Abierto por defecto
})

// Función para alternar secciones
function toggleSection(section: keyof Sections) {
  sections.value[section] = !sections.value[section]
}

// ...existing script...


const router = useRouter()
const notificationStore = useNotificationStore()
const notificationService = NotificationService.getInstance()
const settingsStore = useSettingsStore()
const currencyStore = useCurrencyStore()

// Reactive references
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const currencySettings = ref({
  exchangeRate: 60,
})

const notificationSettings = ref({
  ...settingsStore.notificationSettings,
  soundEnabled: settingsStore.notificationSettings.sound,
  pushEnabled: settingsStore.notificationSettings.enabled,
  alertTimes: settingsStore.notificationSettings.alertTimes.map(alert => ({
    ...alert,
    time: formatAlertTime(alert.minutes)
  }))
})

const isTestScheduled = ref(false)

const finalAlertMinutes = ref(60)
const newAlertHours = ref(2)

// Computed property para ordenar las alertas
const sortedAlerts = computed(() => {
  return settingsStore.notificationSettings.alertTimes.sort((a, b) => b.minutes - a.minutes)
})

function formatAlertTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
  }
  return `${mins}m`
}

function updateFinalAlert() {
  if (finalAlertMinutes.value < 15) {
    alert('La alarma final debe ser al menos 15 minutos antes del evento')
    return
  }
  settingsStore.setDefaultFinalAlert(finalAlertMinutes.value)
}

function addNewAlert() {
  if (newAlertHours.value < 1) {
    alert('Las alertas deben ser al menos 1 hora antes del evento')
    return
  }
  settingsStore.addCustomAlertTime(newAlertHours.value)
}

function removeAlert(minutes: number) {
  settingsStore.removeCustomAlertTime(minutes)
}

// Interval reference
let checkInterval: number | undefined

// Lifecycle hooks
onMounted(async () => {
  try {
    await notificationService.requestNotificationPermission()
    notificationService.startMonitoring() // Iniciamos el monitoreo
    checkInterval = window.setInterval(checkTime, 60000) // Check every minute
  } catch (error) {
    console.error('Error in onMounted:', error)
  }

  // Inicializar tasas de cambio
  await currencyStore.updateExchangeRate()
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
  notificationService.stopMonitoring() // Aseguramos detener el monitoreo
})

// Functions
function checkTime() {
  try {
    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })

    notificationSettings.value.alertTimes.forEach(alert => {
      if (alert.minutes === parseInt(currentTime.replace(':', ''), 10)) {
        notificationService.testNotification() // Usando el método existente para pruebas
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
    const permitted = await notificationService.requestNotificationPermission()
    if (!permitted) {
      alert('Notification permission denied')
      return
    }
    notificationStore.updateSettings(notificationSettings.value)
  } catch (error) {
    console.error('Error updating notification settings:', error)
  }
}

async function logout() {
  try {
    await auth.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    alert('Error al cerrar sesión. Por favor, intente nuevamente.')
  }
}

async function handleAudioFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    // Validar que sea un archivo de audio
    if (!file.type.startsWith('audio/')) {
      throw new Error('El archivo debe ser un archivo de audio')
    }

    // Crear URL para el archivo
    const audioUrl = URL.createObjectURL(file)

    // Probar que el audio se puede reproducir
    const audio = new Audio(audioUrl)
    await new Promise((resolve, reject) => {
      audio.oncanplaythrough = resolve
      audio.onerror = reject
      audio.load()
    })

    // Reproducir brevemente y pausar
    await audio.play()
    setTimeout(() => {
      audio.pause()
      audio.currentTime = 0
    }, 500)

    // Actualizar el store y el servicio
    settingsStore.updateNotificationSettings({
      customAudioUrl: audioUrl,
      sound: true // Activar el sonido automáticamente
    })
    notificationService.setCustomAudioUrl(audioUrl)

    alert('Sonido de notificación actualizado correctamente')
  } catch (error) {
    console.error('Error al cargar el archivo de audio:', error)
    alert('Error al cargar el archivo de audio. Se usará el sonido predeterminado.')

    // Resetear a valores por defecto
    settingsStore.updateNotificationSettings({
      customAudioUrl: null
    })
    notificationService.setCustomAudioUrl(null)

    // Limpiar el input
    const input = event.target as HTMLInputElement
    input.value = ''
  }
}

async function sendTestNotification() {
  try {
    const permitted = await notificationService.requestNotificationPermission()
    if (!permitted) {
      alert('Se requiere permiso para enviar notificaciones')
      return
    }
    await notificationService.testNotification()
  } catch (error) {
    console.error('Error al enviar notificación de prueba:', error)
    alert('Error al enviar la notificación')
  }
}

async function scheduleTestNotification() {
  try {
    const permitted = await notificationService.requestNotificationPermission()
    if (!permitted) {
      alert('Se requiere permiso para enviar notificaciones')
      return
    }

    isTestScheduled.value = true

    // Mostrar notificación previa
    new Notification('Notificación Programada', {
      body: 'La notificación se mostrará en 30 segundos',
      silent: true
    })

    // Programar la notificación
    setTimeout(async () => {
      await notificationService.sendScheduledTestNotification()
      isTestScheduled.value = false
    }, 30000)
  } catch (error) {
    console.error('Error programando notificación:', error)
    alert('Error al programar la notificación')
    isTestScheduled.value = false
  }
}

// Para la calculadora de cambio
const calculatorAmount = ref(0)
const calculatorCurrency = ref('USD')

function formatConvertedAmount(amount: number, fromCurrency: string): string {
  if (!amount) return currencyStore.formatAmount(0)

  const nativeAmount = fromCurrency === currencyStore.settings.nativeCurrency.code
    ? amount
    : currencyStore.convertToNative(amount, fromCurrency)

  return currencyStore.formatAmount(nativeAmount)
}

async function updateExchangeRate() {
  try {
    await currencyStore.updateExchangeRate()
    alert('Tasa de cambio actualizada correctamente')
  } catch (error) {
    // Mostrar mensaje más específico
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la tasa de cambio'
    alert(errorMessage)
  }
}

// Referencias reactivas para los códigos de moneda
const localCurrencyCode = ref('DOP')
const foreignCurrencyCode = ref('USD')

// Observadores para actualizar el store cuando cambien los códigos
watch(localCurrencyCode, (newCode) => {
  const upperCode = newCode.toUpperCase()
  localCurrencyCode.value = upperCode
  currencyStore.updateCurrencySettings({
    nativeCurrency: {
      ...currencyStore.settings.nativeCurrency,
      code: upperCode,
      flag: currencyStore.getFlagEmoji(upperCode)
    }
  })
})

watch(foreignCurrencyCode, (newCode) => {
  const upperCode = newCode.toUpperCase()
  foreignCurrencyCode.value = upperCode
  currencyStore.updateCurrencySettings({
    foreignCurrency: {
      ...currencyStore.settings.foreignCurrency,
      code: upperCode,
      flag: currencyStore.getFlagEmoji(upperCode)
    }
  })
})

// Inicializar valores desde el store
onMounted(() => {
  localCurrencyCode.value = currencyStore.settings.nativeCurrency.code
  foreignCurrencyCode.value = currencyStore.settings.foreignCurrency.code
})
</script>

<style scoped>
.input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500;
  text-transform: uppercase;
}

.label {
  @apply block text-sm font-medium text-gray-700;
}

/* Animación suave para el colapso */
.v-enter-active,
.v-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.v-enter-from,
.v-leave-to {
  max-height: 0;
}
</style>

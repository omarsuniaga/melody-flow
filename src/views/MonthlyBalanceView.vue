<template>
  <div class="min-h-screen p-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <!-- Month Selector -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            Monthly Balance - {{ format(selectedMonth, 'MMMM yyyy') }}
          </h2>
          <div class="flex gap-2">
            <button @click="previousMonth" class="btn btn-secondary">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <button @click="selectedMonth = new Date()" class="btn btn-secondary">
              Current Month
            </button>
            <button @click="nextMonth" class="btn btn-secondary">
              <ChevronRightIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-blue-900">Total Events</h3>
            <p class="text-3xl font-bold text-blue-600">{{ monthlyStats.totalEvents }}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-green-900">Total Revenue</h3>
            <p class="text-3xl font-bold text-green-600">
              {{ formatCurrency(monthlyStats.totalRevenue) }}
            </p>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-purple-900">Average per Event</h3>
            <p class="text-3xl font-bold text-purple-600">
              {{ formatCurrency(monthlyStats.averagePerEvent) }}
            </p>
          </div>
        </div>

        <!-- Provider Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Provider Event Distribution -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Provider Distribution</h3>
            <div class="space-y-2">
              <div v-for="provider in providerStats" :key="provider.name"
                class="flex justify-between items-center">
                <span class="text-gray-700">{{ provider.name }}</span>
                <span class="font-medium">{{ provider.eventCount }} events</span>
              </div>
            </div>
          </div>

          <!-- Provider Revenue Breakdown -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Revenue by Provider</h3>
            <div class="space-y-2">
              <div v-for="provider in providerStats" :key="provider.name"
                class="flex justify-between items-center">
                <span class="text-gray-700">{{ provider.name }}</span>
                <span class="font-medium">{{ formatCurrency(provider.revenue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Status Lists -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <!-- Pending Payments -->
          <div class="bg-red-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-red-900 mb-4">Pending Payments</h3>
            <div class="space-y-2">
              <div v-for="event in pendingPayments" :key="event.id"
                class="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <p class="font-medium">{{ event.provider }}</p>
                  <p class="text-sm text-gray-600">{{ format(new Date(event.date), 'MMM d, yyyy') }}</p>
                </div>
                <span class="font-medium text-red-600">{{ formatCurrency(event.amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Completed Payments -->
          <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-green-900 mb-4">Completed Payments</h3>
            <div class="space-y-2">
              <div v-for="event in completedPayments" :key="event.id"
                class="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <p class="font-medium">{{ event.provider }}</p>
                  <p class="text-sm text-gray-600">{{ format(new Date(event.date), 'MMM d, yyyy') }}</p>
                </div>
                <span class="font-medium text-green-600">{{ formatCurrency(event.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useEventStore } from '../stores/eventStore'
const eventStore = useEventStore()
const selectedMonth = ref(new Date())

// Get all events for the selected month
const monthEvents = computed(() => {
  const start = startOfMonth(selectedMonth.value)
  const end = endOfMonth(selectedMonth.value)
  return eventStore.events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= start && eventDate <= end
  })
})

// Calculate monthly statistics
const monthlyStats = computed(() => {
  const events = monthEvents.value
  const totalRevenue = events.reduce((sum, event) => sum + event.amount, 0)
  return {
    totalEvents: events.length,
    totalRevenue,
    averagePerEvent: events.length > 0 ? totalRevenue / events.length : 0
  }
})

// Calculate provider statistics
const providerStats = computed(() => {
  const stats = new Map()

  monthEvents.value.forEach(event => {
    const current = stats.get(event.provider) || { eventCount: 0, revenue: 0 }
    stats.set(event.provider, {
      eventCount: current.eventCount + 1,
      revenue: current.revenue + event.amount
    })
  })

  return Array.from(stats.entries()).map(([name, data]) => ({
    name,
    ...data
  }))
})

// Filter events by payment status
const pendingPayments = computed(() =>
  monthEvents.value.filter(event => event.paymentStatus === 'Pending')
)

const completedPayments = computed(() =>
  monthEvents.value.filter(event => event.paymentStatus === 'Paid')
)

function previousMonth() {
  selectedMonth.value = subMonths(selectedMonth.value, 1)
}

function nextMonth() {
  selectedMonth.value = addMonths(selectedMonth.value, 1)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
</script>

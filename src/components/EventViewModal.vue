<template>
  <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
         :title="'Detalles del Evento'">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500">Tipo de Actividad</h4>
          <p class="mt-1">{{ event.activityType }}</p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-500">Estado de Pago</h4>
          <p :class="{
            'text-green-600': event.paymentStatus === 'Pagado',
            'text-yellow-600': event.paymentStatus === 'Pendiente'
          }">{{ event.paymentStatus }}</p>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Proveedor</h4>
        <p class="mt-1">{{ event.provider }}</p>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Descripción</h4>
        <p class="mt-1">{{ event.description }}</p>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Lugar</h4>
        <p class="mt-1">{{ event.location }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500">Fecha</h4>
          <p class="mt-1">{{ formatDate(event.date) }}</p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-500">Hora</h4>
          <p class="mt-1">{{ event.time }}</p>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Monto</h4>
        <p class="mt-1">{{ formatCurrency(event.amount) }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <p>Creado: {{ formatDateTime(event.createdAt) }}</p>
        </div>
        <div>
          <p>Actualizado: {{ formatDateTime(event.updatedAt) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="$emit('edit')">Editar</Button>
        <Button variant="primary" @click="close">Cerrar</Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import Modal from './Modal.vue'
import Button from './Button.vue'
import type { MusicEvent } from '../types/event'

const props = defineProps<{
  modelValue: boolean
  event: MusicEvent
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit'): void
}>()

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy')
}

function formatDateTime(date: string | undefined) {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(amount)
}

function close() {
  emit('update:modelValue', false)
}
</script>

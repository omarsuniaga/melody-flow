// componente que permite registrar los pagos mensual de un proveedor

<template>
  <div class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
    <div class="bg-white p-4 rounded w-full max-w-md">
      <h2 class="text-lg font-bold mb-3">Registrar Pagos</h2>

      <!-- Selección de proveedor -->
      <label class="block mb-2">Proveedor</label>
      <select v-model="selectedProvider" class="border p-2 w-full mb-4">
        <option value="">-- Seleccionar --</option>
        <option v-for="provider in providerList" :key="provider" :value="provider">
          {{ provider }}
        </option>
      </select>

      <!-- Selección de mes -->
      <label class="block mb-2">Mes con Pendientes</label>
      <select v-model="selectedMonth" class="border p-2 w-full mb-4">
        <option value="">-- Seleccionar --</option>
        <option v-for="month in monthList" :key="month" :value="month">
          {{ month }}
        </option>
      </select>

      <!-- Total del mes -->
      <p class="text-right font-semibold mb-4">
        Total: {{ formatCurrency(totalMonthAmount) }}
      </p>

      <!-- Botones -->
      <div class="flex justify-end gap-2">
        <button @click="closeModal" class="bg-gray-300 px-4 py-2 rounded">Cerrar</button>
        <button
          @click="paySelectedMonth"
          class="bg-green-500 text-white px-4 py-2 rounded"
        >
          Pagar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits } from "vue";
import { useEventStore } from "../stores/eventStore";

const emit = defineEmits(["close"]);
const eventStore = useEventStore();

const selectedProvider = ref("");
const selectedMonth = ref("");

const providerList = computed(() => {
  // Extraer lista de proveedores con pendientes
  const providers = new Set();
  eventStore.events.forEach((ev) => {
    if (ev.paymentStatus === "Pendiente") {
      providers.add(ev.provider);
    }
  });
  return Array.from(providers);
});

const monthList = computed(() => {
  const monthsMap = new Map<string, number>();

  eventStore.events.forEach((ev) => {
    if (
      ev.paymentStatus === "Pendiente" &&
      ev.amount !== 0 &&
      ev.provider === selectedProvider.value
    ) {
      const [year, month] = ev.date.split("-");
      const key = `${year}-${month}`;
      monthsMap.set(key, (monthsMap.get(key) || 0) + ev.amount);
    }
  });

  return Array.from(monthsMap.entries())
    .filter(([_, sum]) => sum > 0)
    .map(([key]) => key)
    .sort((a, b) => {
      const [aYear, aMonth] = a.split("-");
      const [bYear, bMonth] = b.split("-");
      return parseInt(aYear) - parseInt(bYear) || parseInt(aMonth) - parseInt(bMonth);
    });
});

const totalMonthAmount = computed(() => {
  // Calcular total de eventos pendientes del provider y mes seleccionados
  return eventStore.events.reduce((sum, ev) => {
    if (
      ev.paymentStatus === "Pendiente" &&
      ev.provider === selectedProvider.value &&
      ev.date.startsWith(selectedMonth.value)
    ) {
      return sum + ev.amount;
    }
    return sum;
  }, 0);
});

function closeModal() {
  emit("close");
}

function paySelectedMonth() {
  // Buscar todos los eventos del provider y mes
  const eventsToPay = eventStore.events.filter((ev) => {
    return (
      ev.paymentStatus === "Pendiente" &&
      ev.provider === selectedProvider.value &&
      ev.date.startsWith(selectedMonth.value)
    );
  });
  // Actualizar a "Pagado"
  eventsToPay.forEach((ev) => {
    eventStore.togglePaymentStatus(ev.id, "Pagado");
  });
  closeModal();
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "DOP",
  }).format(val);
}
</script>
<script lang="ts">
// exportar componente
export default {
  name: "makePayments",
};
</script>

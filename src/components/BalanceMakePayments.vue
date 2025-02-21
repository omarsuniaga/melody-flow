// componente que permite registrar los pagos mensual de un proveedor

<template>
  <div class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
    <div class="bg-white p-4 rounded w-full max-w-md">
      <h2 class="text-lg font-bold mb-3">Registrar Pagos</h2>

      <!-- Selección de proveedor sin placeholder -->
      <label class="block mb-2">Proveedor</label>
      <select v-model="selectedProvider" class="border p-2 w-full mb-4">
        <!-- Se elimina <option value="">-- Seleccionar --</option> -->
        <option v-for="(provider, index) in providerList" :key="index" :value="provider">
          {{ provider }}
        </option>
      </select>

      <!-- Selección de mes sin placeholder -->
      <label class="block mb-2">Mes con Pendientes</label>
      <select v-model="selectedMonth" class="border p-2 w-full mb-4">
        <!-- Se elimina <option value="">-- Seleccionar --</option> -->
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
import { ref, computed, defineEmits, watch } from "vue";
import { useEventStore } from "../stores/eventStore";

const emit = defineEmits(["close"]);
const eventStore = useEventStore();

const selectedProvider = ref("");
const selectedMonth = ref("");

// Computa la lista de proveedores con pendientes
const providerList = computed(() => {
  const providers = new Set();
  eventStore.events.forEach((ev) => {
    if (ev.paymentStatus === "Pendiente") {
      providers.add(ev.provider);
    }
  });
  return Array.from(providers);
});

// Computa el proveedor por defecto (el que tiene mayor monto pendiente)
const defaultProvider = computed(() => {
  const totals: Record<string, number> = {};
  eventStore.events.forEach((ev) => {
    if (ev.paymentStatus === "Pendiente") {
      totals[ev.provider] = (totals[ev.provider] || 0) + ev.amount;
    }
  });
  let maxProvider = "";
  let maxAmount = 0;
  for (const provider in totals) {
    if (totals[provider] > maxAmount) {
      maxAmount = totals[provider];
      maxProvider = provider;
    }
  }
  return maxProvider;
});

// Asigna el proveedor por defecto si aún no se ha seleccionado
watch(
  providerList,
  (newList) => {
    if (!selectedProvider.value && newList.length > 0 && defaultProvider.value) {
      selectedProvider.value = defaultProvider.value;
    }
  },
  { immediate: true }
);

// Computa la lista de meses pendientes (ordenados del más antiguo al más reciente)
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

// Asigna el mes pendiente más antiguo si aún no se ha seleccionado
watch(
  monthList,
  (newList) => {
    if (newList.length > 0 && !selectedMonth.value) {
      selectedMonth.value = newList[0];
    }
  },
  { immediate: true }
);

// Nuevo watch para actualizar el mes seleccionado al cambiar el proveedor
watch(selectedProvider, () => {
  selectedMonth.value = monthList.value.length ? monthList.value[0] : "";
});

const totalMonthAmount = computed(() => {
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
  const eventsToPay = eventStore.events.filter((ev) => {
    return (
      ev.paymentStatus === "Pendiente" &&
      ev.provider === selectedProvider.value &&
      ev.date.startsWith(selectedMonth.value)
    );
  });
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

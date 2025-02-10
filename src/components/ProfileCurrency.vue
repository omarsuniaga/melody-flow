<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
    >
      <h3 class="text-lg font-medium text-gray-900">Configuración de Moneda</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform', open ? 'transform rotate-180' : '']"
      />
    </button>
    <div v-show="open" class="p-4">
      <!-- Moneda Nativa -->
      <div class="space-y-4 mb-6">
        <h4 class="font-medium">Moneda Local/Nativa</h4>
        <div class="flex items-center gap-4">
          <input
            v-model="localCode"
            class="input uppercase"
            maxlength="3"
            placeholder="DOP"
          />
          <div class="text-2xl" v-if="localCode">
            {{ getFlagEmoji(localCode) }}
          </div>
        </div>
      </div>
      <!-- Moneda Extranjera -->
      <div class="space-y-4 mb-6">
        <h4 class="font-medium">Moneda Extranjera</h4>
        <div class="flex items-center gap-4">
          <input
            v-model="foreignCode"
            class="input uppercase"
            maxlength="3"
            placeholder="USD"
          />
          <div class="text-2xl" v-if="foreignCode">
            {{ getFlagEmoji(foreignCode) }}
          </div>
        </div>
      </div>
      <!-- Tasa de Cambio -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-medium">Tasa de Cambio</h4>
          <button
            @click="updateExchangeRate"
            class="btn btn-secondary"
            :disabled="isLoading"
          >
            <!-- ...existing icon y lógica de loading... -->
            Actualizar Tasa
          </button>
        </div>
        <div class="text-sm text-gray-500">
          Última actualización: {{ formattedLastUpdate }}
        </div>
        <div class="flex items-center gap-2">
          <span>1 {{ foreignCode }} =</span>
          <input
            v-model.number="exchangeRate"
            type="number"
            class="input w-32"
            min="0"
            step="0.01"
          />
          <span>{{ localCode }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";
import { useCurrencyStore } from "../stores/currencyStore";

const open = ref(false);
function toggle() {
  open.value = !open.value;
}

const currencyStore = useCurrencyStore();
const localCode = ref(currencyStore.settings.nativeCurrency.code);
const foreignCode = ref(currencyStore.settings.foreignCurrency.code);
const exchangeRate = ref(currencyStore.settings.exchangeRate);
const isLoading = ref(false);
const formattedLastUpdate = ref(currencyStore.formattedLastUpdate);

function getFlagEmoji(code: string): string {
  return currencyStore.getFlagEmoji(code);
}

async function updateExchangeRate() {
  try {
    isLoading.value = true;
    await currencyStore.updateExchangeRate();
    alert("Tasa de cambio actualizada correctamente");
  } catch (error) {
    console.error(error);
    alert("Error actualizando la tasa de cambio");
  } finally {
    isLoading.value = false;
  }
}

// Actualizar store al cambiar códigos
watch(localCode, (newCode) => {
  const upper = newCode.toUpperCase();
  localCode.value = upper;
  currencyStore.updateCurrencySettings({
    nativeCurrency: {
      ...currencyStore.settings.nativeCurrency,
      code: upper,
      flag: getFlagEmoji(upper),
    },
  });
});

watch(foreignCode, (newCode) => {
  const upper = newCode.toUpperCase();
  foreignCode.value = upper;
  currencyStore.updateCurrencySettings({
    foreignCurrency: {
      ...currencyStore.settings.foreignCurrency,
      code: upper,
      flag: getFlagEmoji(upper),
    },
  });
});

onMounted(() => {
  localCode.value = currencyStore.settings.nativeCurrency.code;
  foreignCode.value = currencyStore.settings.foreignCurrency.code;
});
</script>
<script lang="ts">
// exportar componente
export default {
  name: "ProfileCurrency",
};
</script>
<style scoped lang="postcss">
/* ...component styles... */
</style>

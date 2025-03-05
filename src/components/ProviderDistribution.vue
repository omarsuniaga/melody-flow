<template>
  <!-- No changes to template section -->
</template>

<script setup>
import type { AppEvent } from "../types/event";

const props = defineProps<{
  providerDistribution: any[];
  showProviderDistribution: boolean;
  events: AppEvent[];
}>();
</script>

<style>
/* No changes to style section */
</style>

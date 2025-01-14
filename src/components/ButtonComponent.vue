<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      loading && 'cursor-wait'
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042
           1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'

export default defineComponent({
  name: 'ButtonComponent',

  props: {
    type: {
      type: null as unknown as PropType<'button' | 'submit' | 'reset' | undefined>,
      default: 'button'
    },
    variant: {
      type: null as unknown as PropType<'primary' | 'secondary' | 'danger' | undefined>,
      default: 'primary'
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },

  setup(props, { attrs }) {
    const { type, variant, loading, disabled } = toRefs(props)
    return {
      type,
      variant,
      loading,
      disabled,
      attrs
    }
  }
})
</script>

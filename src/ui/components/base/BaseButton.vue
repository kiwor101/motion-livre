<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'ghost' | 'primary' | 'danger'
}>(), {
  variant: 'default',
})
</script>

<template>
  <button type="button" :class="[variant, `base-button--${variant}`]">
    <slot />
  </button>
</template>

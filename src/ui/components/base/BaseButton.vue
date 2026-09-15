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

<style scoped>
button.wide {
  display: block;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel2);
  color: var(--text);
  font-size: 12px;
  text-align: center;
  cursor: pointer;
}

button.base-button--danger {
  border-color: #61333a;
  color: #ff9ca5;
}
</style>

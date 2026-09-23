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
  min-height: 32px;
  padding: 6px 9px;
  border: 1px solid var(--panel-border);
  border-radius: 5px;
  background: var(--panel-accent);
  color: var(--panel-foreground);
  font-size: 12px;
  text-align: center;
  cursor: pointer;
}
button.wide:hover { background:var(--accent-bg); }

button.base-button--danger {
  border-color:color-mix(in srgb,var(--destructive) 45%,var(--panel-border));
  color:color-mix(in srgb,var(--destructive) 55%,white);
}
</style>

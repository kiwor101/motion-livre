<script setup lang="ts">
defineProps<{
  title: string
  closeButtonId?: string
}>()
</script>

<template>
  <div class="modal">
    <div class="modal-card">
      <button v-if="closeButtonId" :id="closeButtonId" type="button" class="modal-close">×</button>
      <h2>{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: grid;
  place-items: center;
  background: #000b;
}

.modal[hidden] {
  display: none;
}

.modal-card {
  position: relative;
  width: var(--modal-width, min(900px, 90vw));
  max-width: var(--modal-max-width, 90vw);
  max-height: 82vh;
  padding: 24px;
  overflow: auto;
  border: 1px solid #3c4350;
  border-radius: 14px;
  background: #1b1f27;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  border: 0;
  background: none;
  color: var(--text);
  font-size: 28px;
}
</style>

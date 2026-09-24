<template>
  <div class="popup">
    <slot />
  </div>
</template>

<style scoped>
.popup {
  position: fixed;
  top: 57px;
  right: 105px;
  z-index: 20;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--popover);
  box-shadow: 0 18px 50px #000b;
}

.popup :deep(button) {
  display: block;
  width: 170px;
  padding: 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--popover-foreground);
  text-align: left;
}

.popup :deep(button:hover) {
  background: var(--popover-hover);
}
</style>

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
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #242833;
  box-shadow: 0 10px 30px #0008;
}

.popup :deep(button) {
  display: block;
  width: 170px;
  padding: 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  text-align: left;
}

.popup :deep(button:hover) {
  background: #343949;
}
</style>

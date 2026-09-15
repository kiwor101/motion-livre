<template>
  <div id="toast" class="toast"></div>
</template>

<style scoped>
.toast {
  position: fixed;
  right: 20px;
  bottom: 300px;
  z-index: 10000;
  padding: 10px 14px;
  border: 1px solid #454c5b;
  border-radius: 8px;
  background: #2b303b;
  font-size: 11px;
  opacity: 0;
  transform: translateY(8px);
  transition: 0.2s;
}

.toast.show {
  opacity: 1;
  transform: none;
}
</style>

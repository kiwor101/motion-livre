<template>
  <div id="playhead" class="playhead"></div>
</template>

<style scoped>
.playhead {
  position: absolute;
  top: 0;
  left: 260px;
  z-index: 16;
  width: 14px;
  margin-left: -7px;
  background: linear-gradient(90deg, transparent 7px, #f5f5f5 7px, #f5f5f5 8px, transparent 8px);
  cursor: ew-resize;
  touch-action: none;
}

.playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0.5px;
  display: block;
  width: 13px;
  height: 16px;
  border-radius: 2px;
  background: #f5f5f5;
  clip-path: polygon(8% 0, 92% 0, 92% 68%, 50% 100%, 8% 68%);
}
</style>

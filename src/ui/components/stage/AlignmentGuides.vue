<template>
  <div class="alignment-guides" hidden>
    <span class="guide-label"></span>
    <i class="guide-v one"></i>
    <i class="guide-v two"></i>
    <i class="guide-h one"></i>
    <i class="guide-h two"></i>
  </div>
</template>

<style scoped>
.alignment-guides {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 50;
  width: 100%;
  height: 100%;
  border: 1px solid #e2fbffc9;
  box-shadow: 0 0 0 9999px #0002;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

:global(.stage-area:fullscreen) .alignment-guides {
  display: block;
}

.guide-label {
  position: absolute;
  top: 5px;
  left: 7px;
  color: white;
  font-size: 10px;
  text-shadow: 0 1px 3px black;
}

.guide-v,
.guide-h {
  position: absolute;
  border-color: #e2fbff85;
  border-style: dashed;
  border-width: 0;
}

.guide-v {
  top: 0;
  bottom: 0;
  border-left-width: 1px;
}

.guide-h {
  right: 0;
  left: 0;
  border-top-width: 1px;
}

.guide-v.one { left: 33.333%; }
.guide-v.two { left: 66.666%; }
.guide-h.one { top: 33.333%; }
.guide-h.two { top: 66.666%; }
</style>

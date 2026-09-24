<script setup lang="ts">
defineProps<{
  clipId: number
  kind: string
  title: string
  durationLabel: string
  iconUrl: string
  selected: boolean
  visible: boolean
  keyframes: number[]
}>()

defineEmits<{
  edit: [event: PointerEvent]
  menu: [event: MouseEvent]
  keyframe: [event: PointerEvent, index: number]
}>()
</script>

<template>
  <div
    class="clip pro-clip"
    :class="{'selected-clip': selected}"
    :data-clip="clipId"
    :data-kind="kind"
    :title="`${title} · ${durationLabel}`"
    :style="{opacity: visible ? '1' : '.35', '--clip-icon': `url('${iconUrl}')`}"
    @pointerdown="$emit('edit', $event)"
    @contextmenu="$emit('menu', $event)"
  >
    <div class="filmstrip"></div>
    <span class="clip-label">
      <i class="clip-kind-icon"></i>
      <span class="clip-title">{{ title }}</span>
    </span>
    <i class="clip-handle left"></i>
    <i class="clip-handle right"></i>
    <i v-for="(position, index) in keyframes" :key="`${index}-${position}`" class="key-dot" :style="{left: `${position}%`}" title="Arraste para mover o keyframe" @pointerdown.stop="$emit('keyframe', $event, index)"></i>
  </div>
</template>

<style scoped>
.clip {
  position: absolute;
  top: 0;
  height: var(--clip-height);
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 5px;
  background-clip: padding-box;
  box-shadow: none;
  cursor: grab;
  touch-action: none;
}

.clip:active {
  cursor: grabbing;
}

.clip[data-kind='video'] {
  background: var(--muted-surface);
  color: #fff;
}

.clip[data-kind='image'] {
  background: var(--muted-surface);
  color: #fff;
}

.clip[data-kind='audio'] {
  background: #8f5dba;
  color: #fff;
}

.clip[data-kind='text'] {
  background: #5dbaa0;
  color: #0b241d;
}

.clip:is([data-kind='rect'], [data-kind='circle'], [data-kind='drawing'], [data-kind='path']) {
  background: #ba5d7a;
  color: #fff;
}

.clip:is([data-kind='null'], [data-kind='camera']) {
  border-color: #923f30;
  background: #e66b52;
  color: #702c21;
}

.selected-clip {
  border-color: transparent;
  box-shadow: 0 0 0 1.5px var(--primary);
}

.dragging {
  z-index: 6;
  opacity: .75 !important;
  box-shadow: 0 5px 15px #0008;
}

.invalid-drop {
  border-color: #ff617d !important;
}

.filmstrip {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: flex-start;
  gap: 0;
  overflow: hidden;
  background: transparent;
  pointer-events: none;
}

.clip:not([data-kind='video'], [data-kind='image']) .filmstrip {
  display: none;
}

.filmstrip :deep(img) {
  position: absolute;
  top: 0;
  width: calc(var(--clip-height) * 1.7777778);
  min-width: calc(var(--clip-height) * 1.7777778);
  max-width: none;
  height: 100%;
  margin: 0;
  border-radius: 0;
  object-fit: cover;
  pointer-events: none;
}

.clip-label {
  position: absolute;
  left: var(--clip-label-offset, 0px);
  top: 3px;
  z-index: 2;
  display: flex;
  align-items: center;
  width: max-content;
  max-width: 120px;
  height: 16px;
  padding: 0 4px;
  box-sizing: border-box;
  gap: 3px;
  overflow: hidden;
  background: transparent;
  color: #fff;
  font-size: 10px;
  font-weight: 550;
  line-height: 16px;
  text-shadow: 0 1px 2px #000,0 0 4px #000a;
  white-space: nowrap;
  pointer-events: none;
}

.clip[data-kind='audio'] .clip-label {
  left: calc(var(--clip-label-offset, 0px) + 2px);
  z-index: 3;
  display: inline-flex;
  max-width: min(230px, calc(100% - 6px));
  height: 16px;
  padding: 0 4px;
  background: transparent;
  box-shadow: none;
  color: #fff;
}

.clip:not([data-kind='video'], [data-kind='image']) {
  background-image: repeating-linear-gradient(90deg, #ffffff21 0 1px, transparent 1px 72px);
  background-position-x: var(--timeline-grid-offset, 0px);
}

.clip[data-kind='text'] .clip-label { top:0; height:25px; color:#0b241d; text-shadow:none; }

.clip-kind-icon {
  display:none;
  background: currentColor;
  mask: var(--clip-icon) center / contain no-repeat;
}

.clip-title {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.clip-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 5px;
  background: transparent;
  cursor: ew-resize;
}

.clip-handle.left { left: 0; }
.clip-handle.right { right: 0; }
.clip-handle:hover { background: #09c0d8; }
.selected-clip .clip-handle { background: #fff9; }

.key-dot {
  position: absolute;
  top: 6px;
  width: 11px;
  height: 11px;
  border: 2px solid #fff;
  border-radius: 2px;
  background: #7b5cff;
  transform: translateX(-50%) rotate(45deg);
  z-index: 5;
  cursor: ew-resize;
  box-shadow: 0 0 0 2px #241661, 0 2px 5px #000;
  transition: transform .12s ease, background .12s ease, box-shadow .12s ease;
}

.key-dot:hover { background: #d9d0ff; transform: translateX(-50%) rotate(45deg) scale(1.35); box-shadow: 0 0 0 2px #8f78ff; }
.key-dot.dragging-keyframe { background: #9d7cff; transform: translateX(-50%) rotate(45deg) scale(1.45); box-shadow: 0 0 0 3px #fff; }

:deep(.clip-waveform) {
  position: absolute;
  inset: 1px 4px;
  width: calc(100% - 8px);
  height: calc(100% - 2px);
  opacity: 1;
  image-rendering: auto;
  pointer-events: none;
}

.clip[data-kind='audio'] :deep(.clip-waveform) {
  inset: 20px 0 0;
  width: 100%;
  height: calc(100% - 20px);
  opacity: 1;
}
</style>

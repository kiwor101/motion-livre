<script setup lang="ts">
defineProps<{
  title: string
  locked: boolean
  visible: boolean
  muted: boolean
  hasAudio: boolean
  multiSelected: boolean
}>()

defineEmits<{
  toggleLock: []
  toggleVisibility: []
  toggleMute: []
  toggleMulti: []
}>()
</script>

<template>
  <div class="track-name">
    <span class="layer-title">{{ title }}</span>
    <button type="button" data-lock title="Bloquear faixa" @click.stop="$emit('toggleLock')">{{ locked ? '🔒' : '🔓' }}</button>
    <button type="button" data-vis title="Ocultar faixa" @click.stop="$emit('toggleVisibility')">{{ visible ? '●' : '○' }}</button>
    <button type="button" data-mute title="Silenciar faixa" :disabled="!hasAudio" @click.stop="$emit('toggleMute')">{{ hasAudio && muted ? '🔇' : '🔊' }}</button>
    <button type="button" data-multi title="Marcar clipes para precomposição" @click.stop="$emit('toggleMulti')">{{ multiSelected ? '☑' : '☐' }}</button>
  </div>
</template>

<style scoped>
.track-name {
  position: sticky;
  left: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  height: var(--lane-height);
  margin-right: 0;
  padding: 0 11px 0 16px;
  gap: 4px;
  overflow: hidden;
  border-right: 1px solid var(--line);
  background: var(--panel);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.track-name[draggable='true'] {
  cursor: grab;
}

.layer-title {
  order: 0;
  flex: 1;
  min-width: 0;
  margin-right: 7px;
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  font-weight: 450;
  white-space: nowrap;
  text-overflow: ellipsis;
}

button {
  font-size: 10px;
}

:deep(.track-rename) {
  order: 0;
  flex: 1;
  min-width: 0;
  margin-right: 4px;
  padding: 3px 5px;
  border-color: var(--accent);
  background: var(--bg);
}
</style>

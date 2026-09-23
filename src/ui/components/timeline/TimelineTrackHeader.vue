<script setup lang="ts">
import AppIcon from '../base/AppIcon.vue'

defineProps<{
  kind: 'video' | 'audio' | 'text'
  title: string
  locked: boolean
  visible: boolean
  muted: boolean
  hasAudio: boolean
  multiSelected: boolean
}>()

defineEmits<{
  select: []
  rename: [title: string]
  toggleLock: []
  toggleVisibility: []
  toggleMute: []
  toggleMulti: []
}>()
</script>

<template>
  <div class="track-name" :title="title" @click.self="$emit('select')">
    <button type="button" data-mute :aria-label="muted ? 'Ativar áudio da faixa' : 'Silenciar faixa'" :title="muted ? 'Ativar áudio da faixa' : 'Silenciar faixa'" :disabled="!hasAudio" @click.stop="$emit('toggleMute')"><AppIcon :name="hasAudio && muted ? 'volume-off' : 'volume-up'" :size="16" /></button>
    <button type="button" data-vis :aria-label="visible ? 'Ocultar faixa' : 'Mostrar faixa'" :title="visible ? 'Ocultar faixa' : 'Mostrar faixa'" @click.stop="$emit('toggleVisibility')"><AppIcon :name="visible ? 'visibility' : 'visibility-off'" :size="16" /></button>
    <button v-if="locked" type="button" data-lock aria-label="Desbloquear faixa" title="Desbloquear faixa" @click.stop="$emit('toggleLock')"><AppIcon name="lock" :size="16" /></button>
    <button v-else type="button" class="track-kind" aria-label="Selecionar faixa" :title="title" @click.stop="$emit('select')"><AppIcon :name="kind === 'audio' ? 'music-note' : kind === 'video' ? 'videocam' : 'title'" :size="16" /></button>
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
  justify-content: center;
  padding: 0 8px;
  gap: 2px;
  overflow: hidden;
  border-right: 1px solid var(--panel-border);
  background: var(--panel-background);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.track-name[draggable='true'] {
  cursor: grab;
}

button {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  padding: 0;
  font-size: 10px;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
}
button:hover{background:var(--panel-accent);color:var(--panel-foreground)}
button:disabled{opacity:.35}
.track-kind{color:var(--muted-foreground)}
.track-reorder-target{background:var(--panel-accent)}
</style>

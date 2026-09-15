<script setup lang="ts">
import {nextTick, ref} from 'vue'
import AppIcon from '../base/AppIcon.vue'

const props = defineProps<{
  title: string
  locked: boolean
  visible: boolean
  muted: boolean
  hasAudio: boolean
  multiSelected: boolean
}>()

const emit = defineEmits<{
  select: []
  rename: [title: string]
  toggleLock: []
  toggleVisibility: []
  toggleMute: []
  toggleMulti: []
}>()

const editing = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)

async function startRename(): Promise<void> {
  if (props.locked) return
  draft.value = props.title
  editing.value = true
  await nextTick()
  input.value?.select()
}

function finishRename(save: boolean): void {
  if (!editing.value) return
  const title = draft.value.trim()
  editing.value = false
  if (save && title && title !== props.title) emit('rename', title)
}
</script>

<template>
  <div class="track-name">
    <input v-if="editing" ref="input" v-model="draft" class="track-rename" @click.stop @dblclick.stop @keydown.enter.stop="finishRename(true)" @keydown.esc.stop="finishRename(false)" @blur="finishRename(true)">
    <span v-else class="layer-title" title="Clique para selecionar; duplo clique para renomear" @click.stop="$emit('select')" @dblclick.stop="startRename">{{ title }}</span>
    <button type="button" data-lock :aria-label="locked ? 'Desbloquear faixa' : 'Bloquear faixa'" :title="locked ? 'Desbloquear faixa' : 'Bloquear faixa'" @click.stop="$emit('toggleLock')"><AppIcon :name="locked ? 'lock' : 'lock-open'" :size="16" /></button>
    <button type="button" data-vis :aria-label="visible ? 'Ocultar faixa' : 'Mostrar faixa'" :title="visible ? 'Ocultar faixa' : 'Mostrar faixa'" @click.stop="$emit('toggleVisibility')"><AppIcon :name="visible ? 'visibility' : 'visibility-off'" :size="16" /></button>
    <button type="button" data-mute :aria-label="muted ? 'Ativar áudio da faixa' : 'Silenciar faixa'" :title="muted ? 'Ativar áudio da faixa' : 'Silenciar faixa'" :disabled="!hasAudio" @click.stop="$emit('toggleMute')"><AppIcon :name="hasAudio && muted ? 'volume-off' : 'volume-up'" :size="16" /></button>
    <button type="button" data-multi aria-label="Marcar clipes para precomposição" title="Marcar clipes para precomposição" @click.stop="$emit('toggleMulti')"><AppIcon :name="multiSelected ? 'check-box' : 'check-box-outline-blank'" :size="16" /></button>
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
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 10px;
}

.track-rename {
  order: 0;
  flex: 1;
  min-width: 0;
  margin-right: 4px;
  padding: 3px 5px;
  border-color: var(--accent);
  background: var(--bg);
}
</style>

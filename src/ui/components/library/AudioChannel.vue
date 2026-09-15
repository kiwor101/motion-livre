<script setup lang="ts">
interface AudioChannelItem {
  id: number
  kind: 'audio' | 'video'
  name: string
  volume: number
  pan: number
  channel: string
  muted: boolean
  solo: boolean
}

const props = defineProps<{ item: AudioChannelItem }>()
const emit = defineEmits<{
  select: [id: number]
  change: [id: number, key: 'volume' | 'pan' | 'audioChannel' | 'muted' | 'solo', value: number | string | boolean]
}>()

function numberValue(event: Event): number {
  return Number((event.currentTarget as HTMLInputElement).value)
}
</script>

<template>
  <div class="audio-channel" @click="emit('select', item.id)">
    <strong>{{ item.kind === 'video' ? '🎬' : '♫' }} {{ item.name }}</strong>
    <label>Volume {{ item.volume }}%<input data-volume type="range" min="0" max="200" :value="item.volume" @input="emit('change', item.id, 'volume', numberValue($event))"></label>
    <label>Pan L/R {{ item.pan }}<input data-pan type="range" min="-100" max="100" :value="item.pan" @input="emit('change', item.id, 'pan', numberValue($event))"></label>
    <label>Fonte<select data-channel :value="item.channel" @change="emit('change', item.id, 'audioChannel', ($event.currentTarget as HTMLSelectElement).value)"><option value="stereo">Estéreo</option><option value="left">Somente canal esquerdo</option><option value="right">Somente canal direito</option></select></label>
    <label><input data-mute type="checkbox" :checked="item.muted" @change="emit('change', item.id, 'muted', ($event.currentTarget as HTMLInputElement).checked)"> Mudo</label>
    <label><input data-solo type="checkbox" :checked="item.solo" @change="emit('change', item.id, 'solo', ($event.currentTarget as HTMLInputElement).checked)"> Solo</label>
  </div>
</template>

<style scoped>
.audio-channel {
  margin: 7px 0;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel2);
}

.audio-channel strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-channel label {
  margin: 6px 0;
}

.audio-channel input[type="range"] {
  width: 100%;
}
</style>

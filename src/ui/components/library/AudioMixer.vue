<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AudioChannel from './AudioChannel.vue'

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

const root = ref<HTMLElement | null>(null)
const channels = ref<AudioChannelItem[]>([])

async function updateChannels(event: Event) {
  channels.value = (event as CustomEvent<AudioChannelItem[]>).detail
  await nextTick()
  const controls = [...(root.value?.querySelectorAll<HTMLElement>('[data-volume], [data-pan]') ?? [])]
  window.dispatchEvent(new CustomEvent('motion:audio-mixer-controls', { detail: controls }))
}

function select(id: number) {
  window.dispatchEvent(new CustomEvent('motion:audio-mixer-select', { detail: id }))
}

function change(id: number, key: 'volume' | 'pan' | 'audioChannel' | 'muted' | 'solo', value: number | string | boolean) {
  const item = channels.value.find(channel => channel.id === id)
  if (item) {
    if (key === 'volume' && typeof value === 'number') item.volume = value
    if (key === 'pan' && typeof value === 'number') item.pan = value
    if (key === 'audioChannel' && typeof value === 'string') item.channel = value
    if (key === 'muted' && typeof value === 'boolean') item.muted = value
    if (key === 'solo' && typeof value === 'boolean') item.solo = value
  }
  window.dispatchEvent(new CustomEvent('motion:audio-mixer-change', { detail: { id, key, value } }))
}

onMounted(() => window.addEventListener('motion:audio-mixer-update', updateChannels))
onBeforeUnmount(() => window.removeEventListener('motion:audio-mixer-update', updateChannels))
</script>

<template>
  <div id="audioMixer" ref="root" class="asset-list">
    <div v-if="!channels.length" class="empty">Importe áudio ou um vídeo com som</div>
    <AudioChannel v-for="channel in channels" :key="channel.id" :item="channel" @select="select" @change="change" />
  </div>
</template>

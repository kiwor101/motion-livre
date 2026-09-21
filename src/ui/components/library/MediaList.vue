<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface MediaListItem {
  index: number
  name: string
  title: string
  type: 'video' | 'image' | 'audio'
  url: string
  duration: number
}

const items = ref<MediaListItem[]>([])

function updateItems(event: Event) {
  items.value = (event as CustomEvent<MediaListItem[]>).detail
}

function select(index: number) {
  window.dispatchEvent(new CustomEvent('motion:media-library-select', { detail: index }))
}

onMounted(() => window.addEventListener('motion:media-library-update', updateItems))
onBeforeUnmount(() => window.removeEventListener('motion:media-library-update', updateItems))
</script>

<template>
  <div id="mediaList" class="asset-list">
    <div v-if="!items.length" class="empty">Arraste arquivos para cá ou clique em Importar</div>
    <button v-for="item in items" :key="item.index" type="button" class="asset" :title="item.title" @click="select(item.index)">
      <span class="asset-preview" :data-kind="item.type">
        <img v-if="item.type === 'image'" :src="item.url" alt="">
        <video v-else-if="item.type === 'video'" :src="item.url" muted preload="metadata"></video>
        <span v-else class="audio-placeholder">♫<small>Áudio</small></span>
        <small v-if="item.duration" class="duration">{{ Math.floor(item.duration / 60) }}:{{ String(Math.floor(item.duration % 60)).padStart(2, '0') }}</small>
      </span>
      <span class="asset-name">{{ item.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.asset-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  align-content: start;
  gap: 12px 10px;
  margin-top: 0 !important;
  border: 0 !important;
  background: transparent !important;
}

.asset-list > .empty { grid-column: 1 / -1; margin-top: 14px; padding: 34px 12px; border: 1px dashed var(--line); border-radius: 6px; }

.asset {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  line-height: 1.25;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.asset-preview { position: relative; width: 100%; aspect-ratio: 16 / 10; display: grid; place-items: center; overflow: hidden; border: 1px solid #2c2c2f; border-radius: 3px; background: #242426; }
.asset-preview img, .asset-preview video { width: 100%; height: 100%; display: block; object-fit: cover; }
.audio-placeholder { display: flex; flex-direction: column; align-items: center; color: #89898f; font-size: 25px; }
.audio-placeholder small { font-size: 9px; }
.duration { position: absolute; right: 3px; bottom: 3px; padding: 1px 3px; border-radius: 2px; background: #000b; color: #fff; font-size: 8px; }
.asset-name { width: 100%; padding: 5px 1px 0; overflow: hidden; color: #99999f; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }

.asset:hover {
  border-color: var(--line) !important;
  background: color-mix(in srgb, var(--accent) 10%, var(--panel2)) !important;
}
</style>

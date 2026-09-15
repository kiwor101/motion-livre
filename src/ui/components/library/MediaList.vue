<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface MediaListItem {
  index: number
  name: string
  title: string
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
    <div v-if="!items.length" class="empty">Seus arquivos aparecerão aqui</div>
    <button v-for="item in items" :key="item.index" type="button" class="asset" :title="item.title" @click="select(item.index)">{{ item.name }}</button>
  </div>
</template>

<style scoped>
.asset {
  display: block;
  width: 100%;
  margin: 0;
  padding: 16px;
  overflow: hidden;
  border: solid var(--line);
  border-width: 0 0 1px;
  border-radius: 0;
  background: var(--panel2);
  color: var(--text);
  line-height: 1.45;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.asset:hover {
  border-color: var(--line) !important;
  background: color-mix(in srgb, var(--accent) 10%, var(--panel2)) !important;
}
</style>

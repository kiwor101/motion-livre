<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface MenuAction {
  id: string
  label: string
}

const menu = ref<HTMLElement | null>(null)
const actions = ref<MenuAction[]>([])
const visible = ref(false)
const left = ref(0)
const top = ref(0)

async function open(event: Event) {
  const detail = (event as CustomEvent<{ x: number; y: number; actions: MenuAction[] }>).detail
  actions.value = detail.actions
  left.value = Math.min(innerWidth - 190, detail.x)
  top.value = detail.y
  visible.value = true
  await nextTick()
  top.value = Math.max(8, Math.min(innerHeight - (menu.value?.offsetHeight ?? 0) - 10, detail.y))
}

function close() {
  visible.value = false
  actions.value = []
}

function choose(id: string) {
  window.dispatchEvent(new CustomEvent('motion:timeline-context-action', { detail: id }))
  close()
}

function closeFromPointer(event: PointerEvent) {
  if (visible.value && !menu.value?.contains(event.target as Node)) close()
}

function closeFromKeyboard(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  window.addEventListener('motion:timeline-context-open', open)
  document.addEventListener('pointerdown', closeFromPointer)
  document.addEventListener('keydown', closeFromKeyboard)
})
onBeforeUnmount(() => {
  window.removeEventListener('motion:timeline-context-open', open)
  document.removeEventListener('pointerdown', closeFromPointer)
  document.removeEventListener('keydown', closeFromKeyboard)
})
</script>

<template>
  <div v-show="visible" ref="menu" class="clip-context-menu" :style="{ left: `${left}px`, top: `${top}px` }">
    <button v-for="action in actions" :key="action.id" type="button" @click="choose(action.id)">{{ action.label }}</button>
  </div>
</template>

<style scoped>
.clip-context-menu {
  position: fixed;
  z-index: 1100;
  width: 180px;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel2);
  box-shadow: 0 12px 35px #000a;
}

.clip-context-menu button {
  display: block;
  width: 100%;
  margin: 0;
  padding: 7px 9px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text);
  text-align: left;
}

.clip-context-menu button:hover {
  background: color-mix(in srgb, var(--accent) 14%, var(--panel2)) !important;
}
</style>

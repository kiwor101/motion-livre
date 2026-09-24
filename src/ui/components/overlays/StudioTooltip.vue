<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'

const tooltip = ref<HTMLElement | null>(null)
const portal = shallowRef<HTMLElement>(document.body)
const visible = ref(false)
const text = ref('')
const left = ref('0px')
const top = ref('0px')
let described: HTMLElement | null = null
let request = 0

const tooltipTarget = (source: EventTarget | null) => source instanceof Element ? source.closest<HTMLElement>('[data-tooltip]') : null

async function show(target: HTMLElement | null): Promise<void> {
  if (!target?.dataset.tooltip) return
  const current = ++request
  if (described !== target) described?.removeAttribute('aria-describedby')
  described = target
  text.value = target.dataset.tooltip
  target.setAttribute('aria-describedby', 'studioTooltip')
  visible.value = true
  await nextTick()
  if (current !== request || !tooltip.value || described !== target) return
  const anchor = target.getBoundingClientRect()
  const box = tooltip.value.getBoundingClientRect()
  left.value = `${Math.max(8, Math.min(innerWidth - box.width - 8, anchor.left + anchor.width / 2 - box.width / 2))}px`
  top.value = `${anchor.bottom + 10 + box.height > innerHeight ? anchor.top - box.height - 10 : anchor.bottom + 10}px`
}

function hide(): void {
  request++
  visible.value = false
  described?.removeAttribute('aria-describedby')
  described = null
}

const onPointerOver = (event: PointerEvent) => void show(tooltipTarget(event.target))
const onPointerOut = (event: PointerEvent) => {
  const from = tooltipTarget(event.target)
  const to = tooltipTarget(event.relatedTarget)
  if (from && from !== to) hide()
}
const onFocusIn = (event: FocusEvent) => void show(tooltipTarget(event.target))
const onFocusOut = (event: FocusEvent) => {
  if (tooltipTarget(event.target) !== tooltipTarget(event.relatedTarget)) hide()
}
const onFullscreenChange = () => {
  portal.value = document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : document.body
  if (described) void show(described)
}

onMounted(() => {
  document.addEventListener('pointerover', onPointerOver)
  document.addEventListener('pointerout', onPointerOut)
  document.addEventListener('pointerdown', hide)
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerover', onPointerOver)
  document.removeEventListener('pointerout', onPointerOut)
  document.removeEventListener('pointerdown', hide)
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  hide()
})
</script>

<template>
  <Teleport :to="portal">
    <div id="studioTooltip" ref="tooltip" class="studio-tooltip" role="tooltip" :hidden="!visible" :style="{left, top}">{{ text }}</div>
  </Teleport>
</template>

<style scoped>
.studio-tooltip{position:fixed;z-index:100000;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--panel2);box-shadow:0 4px 16px #0008;color:var(--text);font-size:11px;white-space:nowrap;pointer-events:none}
</style>

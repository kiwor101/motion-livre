<script setup lang="ts">
defineProps<{
  kind: 'manual' | 'beat'
  index: number
  time: number
  left: number
  label: string
}>()

defineEmits<{
  drag: [event: PointerEvent, kind: 'manual' | 'beat', index: number]
  menu: [event: MouseEvent, kind: 'manual' | 'beat', index: number]
}>()
</script>

<template>
  <i
    class="timeline-marker"
    :class="kind === 'beat' ? 'beat-marker' : 'manual-marker'"
    :data-marker-type="kind"
    :data-marker-index="index"
    :style="{ left: `${left}px` }"
    :title="label"
    @pointerdown="$emit('drag', $event, kind, index)"
    @contextmenu="$emit('menu', $event, kind, index)"
  />
</template>

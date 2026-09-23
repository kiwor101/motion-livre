<script setup lang="ts">
import TimelineClip from './TimelineClip.vue'
import TimelineTrackHeader from './TimelineTrackHeader.vue'

interface ClipView {
  id: number
  kind: string
  title: string
  durationLabel: string
  iconUrl: string
  selected: boolean
  visible: boolean
  keyframes: number[]
}

defineProps<{
  trackId: string | number
  kind: 'video' | 'audio' | 'text'
  width: number
  headerWidth: number
  contentWidth: number
  title: string
  locked: boolean
  visible: boolean
  muted: boolean
  hasAudio: boolean
  multiSelected: boolean
  clips: ClipView[]
}>()

defineEmits<{
  toggleLock: []
  select: []
  rename: [title: string]
  toggleVisibility: []
  toggleMute: []
  toggleMulti: []
  edit: [event: PointerEvent, clipId: number]
  menu: [event: MouseEvent, clipId: number]
  keyframe: [event: PointerEvent, clipId: number, index: number]
  marquee: [event: PointerEvent]
}>()
</script>

<template>
  <div class="track" :data-track="trackId" :data-kind="kind" :style="{width: `${width}px`, gridTemplateColumns: `${headerWidth}px ${contentWidth}px`}">
    <TimelineTrackHeader
      :kind="kind"
      :title="title"
      :locked="locked"
      :visible="visible"
      :muted="muted"
      :has-audio="hasAudio"
      :multi-selected="multiSelected"
      @select="$emit('select')"
      @rename="title => $emit('rename', title)"
      @toggle-lock="$emit('toggleLock')"
      @toggle-visibility="$emit('toggleVisibility')"
      @toggle-mute="$emit('toggleMute')"
      @toggle-multi="$emit('toggleMulti')"
    />
    <div class="track-lane" @pointerdown.self="$emit('marquee', $event)">
      <TimelineClip
        v-for="clip in clips"
        :key="clip.id"
        :clip-id="clip.id"
        :kind="clip.kind"
        :title="clip.title"
        :duration-label="clip.durationLabel"
        :icon-url="clip.iconUrl"
        :selected="clip.selected"
        :visible="clip.visible"
        :keyframes="clip.keyframes"
        @edit="$emit('edit', $event, clip.id)"
        @menu="$emit('menu', $event, clip.id)"
        @keyframe="(event, index) => $emit('keyframe', event, clip.id, index)"
      />
    </div>
  </div>
</template>

<style scoped>
.track{position:relative;display:grid;height:var(--lane-height);margin-bottom:6px;background:var(--panel-background)}
.track[data-kind='video']{--lane-height:65px;--clip-height:65px}.track[data-kind='audio']{--lane-height:50px;--clip-height:50px}.track[data-kind='text']{--lane-height:25px;--clip-height:25px}
.track-lane{position:relative;height:var(--lane-height);background:var(--panel-background);transition:background-color .14s ease}
:global(.timeline .drop-target) .track-lane{background:color-mix(in srgb,var(--primary) 14%,var(--panel-background))}
</style>

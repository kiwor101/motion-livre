<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseField from './BaseField.vue'

const props = withDefaults(defineProps<{
  label: string
  inputId: string
  outputId?: string
  min: number
  max: number
  step?: number
  value?: number
  output?: string
}>(), {
  step: 1,
  value: 0,
  output: '',
})

const range = ref<HTMLInputElement | null>(null)
function syncProgress() {
  const input = range.value
  if (!input) return
  const min = Number(input.min || props.min)
  const max = Number(input.max || props.max)
  const progress = max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100
  input.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, progress))}%`)
}
onMounted(syncProgress)
</script>

<template>
  <BaseField :label="label">
    <template #aside><output v-if="outputId" :id="outputId">{{ output }}</output></template>
    <input :id="inputId" ref="range" type="range" :min="min" :max="max" :step="step" :value="value" @input="syncProgress" @change="syncProgress">
  </BaseField>
</template>

<style scoped>
input {
  display: block;
  width: 100%;
  height: 16px;
  margin-top: 7px;
  appearance: none;
  border: 0;
  border-radius: 999px;
  outline: 0;
  background: linear-gradient(to right, var(--primary) 0 var(--range-progress, 0%), var(--panel-accent) var(--range-progress, 0%) 100%);
  background-size: 100% 6px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
}
input::-webkit-slider-runnable-track { height:6px; border-radius:999px; background:transparent; }
input::-webkit-slider-thumb { width:16px; height:16px; margin-top:-5px; appearance:none; border:1px solid color-mix(in srgb,var(--primary) 50%,transparent); border-radius:50%; background:var(--background); box-shadow:0 1px 3px #0008; }
input:focus-visible::-webkit-slider-thumb { box-shadow:0 0 0 2px color-mix(in srgb,var(--primary) 25%,transparent); }

output {
  float: right;
  color: var(--panel-foreground);
  font-variant-numeric: tabular-nums;
}
</style>

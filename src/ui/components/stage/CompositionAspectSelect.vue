<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'

const customAspect = ref('')
function updateCustom(event: Event) { customAspect.value = (event as CustomEvent<string>).detail }
onMounted(() => window.addEventListener('motion:custom-aspect', updateCustom))
onBeforeUnmount(() => window.removeEventListener('motion:custom-aspect', updateCustom))
</script>

<template>
  <select id="aspect" hidden aria-label="Proporção da composição">
    <option value="16/9">16:9</option>
    <option value="9/16">9:16</option>
    <option value="1/1">1:1</option>
    <option value="4/5">4:5</option>
    <option v-if="customAspect" data-custom :value="customAspect">{{ customAspect.replace('/', ':') }}</option>
  </select>
</template>

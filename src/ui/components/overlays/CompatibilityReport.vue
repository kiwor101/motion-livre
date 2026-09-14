<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'
import BaseButton from '../base/BaseButton.vue'
import BaseModal from '../base/BaseModal.vue'
import {COMPATIBILITY_REPORT_EVENT, type CompatibilityReportPayload} from '../../compat/compatibility-report-event'

const report = ref<CompatibilityReportPayload | null>(null)
const receiveReport = (event: Event) => {
  report.value = (event as CustomEvent<CompatibilityReportPayload>).detail
}

onMounted(() => window.addEventListener(COMPATIBILITY_REPORT_EVENT, receiveReport))
onBeforeUnmount(() => window.removeEventListener(COMPATIBILITY_REPORT_EVENT, receiveReport))
</script>

<template>
  <BaseModal id="compatReport" title="Relatório de compatibilidade XML" close-button-id="closeCompatReport" hidden>
    <div v-if="report" id="compatReportBody">
      <p><strong>{{ report.mode === 'export' ? 'Cena exportada' : 'Cena importada' }}:</strong> {{ report.layers }} camada(s), {{ report.keyframes }} keyframe(s). Formato AM {{ report.sourceVersion }}.</p>
      <template v-if="report.unsupportedEffects.length">
        <h3>Efeitos preservados, sem prévia idêntica</h3>
        <ul><li v-for="effect in report.unsupportedEffects" :key="effect">{{ effect }}</li></ul>
      </template>
      <p v-else>Os efeitos reconhecidos foram convertidos para a prévia do Motion Livre.</p>
      <template v-if="report.unresolvedMedia.length">
        <h3>Mídias para religar</h3>
        <p>O XML referencia arquivos que não vêm embutidos. Importe essas mídias novamente no projeto:</p>
        <ul><li v-for="media in report.unresolvedMedia" :key="media">{{ media }}</li></ul>
      </template>
    </div>
    <div v-else id="compatReportBody"></div>
    <BaseButton id="acceptCompatReport" class="wide primary" variant="primary">Entendi</BaseButton>
  </BaseModal>
</template>

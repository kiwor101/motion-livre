<script setup lang="ts">
import BaseModal from '../base/BaseModal.vue'

const featureGroups = [
  {title: 'Projeto e arquivos', items: ['Criar, renomear e salvar projetos', 'Importar/exportar projeto JSON', 'Importar/exportar cenas XML compatíveis com Alight Motion', 'Composições 16:9, 9:16, 1:1 e 4:5', 'Resolução, FPS, duração e fundo', 'Templates, presets e pacotes de elementos']},
  {title: 'Camadas', items: ['Vídeo, imagem, áudio, texto e formas', 'Desenho vetorial livre', 'Duplicar, excluir e reordenar', 'Agrupamento e pré-composição', 'Entrada, saída e recorte temporal', 'Máscaras, clipping e parenting']},
  {title: 'Animação', items: ['Keyframes por propriedade', 'Easing linear, suave, aceleração, desaceleração e rebote', 'Posição, escala, rotação e opacidade', 'Caminhos de movimento e gráfico de curva', 'Parenting, nulos e precomposição', 'Retiming, reverso e velocidade de mídia']},
  {title: 'Visual', items: ['Cor sólida e gradientes', 'Contorno, cantos, transparência e máscaras', 'Modos de mesclagem', 'Glow, vinheta, blur, nitidez, contraste e matiz', 'Chroma key, canais RGB, saturação, sépia e inversão', 'Recorte, âncora e espelhamento']},
  {title: 'Texto e vetores', items: ['Família e tamanho de fonte', 'Alinhamento e cor', 'Formas retângulo/círculo', 'Splines e desenho manual', 'Preenchimento e contorno', 'Elementos nulos e grupos']},
  {title: 'Mídia e saída', items: ['Navegador de mídia, waveform e mixer', 'Preview sincronizado', 'Canais L/R, pan, solo, mute e fades', 'MP4, MOV, WebM, GIF, PNG e MP3', 'Presets 720p, 1080p, 1440p e 4K', 'Qualidade, FPS, bitrate, faixa e transparência']},
  {title: 'Experiência offline', items: ['Sem anúncios', 'Sem pagamentos ou assinatura', 'Sem conta obrigatória', 'Projetos armazenados localmente', 'Sem notificações promocionais', 'Sem telemetria']},
]
</script>

<template>
  <BaseModal id="featureModal" title="Recursos do Motion Livre" close-button-id="closeFeatures" hidden>
    <div id="featureGrid" class="feature-grid">
      <section v-for="group in featureGroups" :key="group.title" class="feature-card">
        <h3>{{ group.title }}</h3>
        <ul><li v-for="item in group.items" :key="item">{{ item }}</li></ul>
      </section>
    </div>
  </BaseModal>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.feature-card {
  padding: 14px;
  border-radius: 10px;
  background: #242934;
}

.feature-card h3 {
  margin: 0 0 8px;
  color: #aa96ff;
}

.feature-card ul {
  padding-left: 17px;
  color: #c7ccd6;
  font-size: 12px;
}

.feature-card li {
  margin: 4px 0;
}

@media (max-width: 1000px) {
  .feature-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

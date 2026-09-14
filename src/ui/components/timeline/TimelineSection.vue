<template>
  <section class="timeline-section">
    <div class="timeline-controls"><strong>Timeline</strong><button id="addMarker">+ Marcador</button><button id="clearMarkers">Limpar marcadores</button><label><input id="snapTimeline" type="checkbox" checked> Encaixe</label><label>Zoom <input id="timelineZoom" type="range" min="1" max="5" step="0.25" value="1"></label></div>
    <div class="timeline-head"><strong>Camadas</strong><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span></div>
    <div id="timeline" class="timeline"><div class="timeline-empty">Adicione uma camada para começar</div><div id="playhead" class="playhead"></div></div>
  </section>
</template>

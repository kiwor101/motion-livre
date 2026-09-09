<template>
  <section class="stage-area">
    <div class="stage-toolbar"><span>Composição</span><select id="aspect"><option value="16/9">16:9</option><option value="9/16">9:16</option><option value="1/1">1:1</option><option value="4/5">4:5</option></select><button id="fitStage">Ajustar</button></div>
    <div class="stage-wrap"><div id="stage" class="stage"><div class="stage-hint">Importe uma mídia ou adicione texto</div></div></div>
    <div class="transport"><button id="toStart">|◀</button><button id="playBtn" class="play">▶</button><span id="timeLabel">00:00.00 / 00:10.00</span><input id="timeSlider" type="range" min="0" max="10" step="0.01" value="0"><button id="muteBtn">🔊</button></div>
  </section>
</template>

<template>
  <div id="panel-cut" class="panel">
    <h2>Corte e tempo</h2><p>Selecione um vídeo e posicione o cursor na linha do tempo.</p>
    <button id="setInPoint" class="wide">Definir entrada no cursor</button>
    <button id="setOutPoint" class="wide">Definir saída no cursor</button>
    <button id="splitAtPlayhead" class="wide">✂ Dividir no cursor</button>
    <button id="resetTrim" class="wide">Restaurar vídeo inteiro</button>
    <hr>
    <label>Velocidade <output id="outSpeed">1.00×</output><input id="propSpeed" type="range" min="0.5" max="2" step="0.05" value="1"></label>
    <label>Volume <output id="outVolume">100%</output><input id="propVolume" type="range" min="0" max="200" value="100"></label>
    <label>Fade de entrada (s)<input id="propFadeIn" type="number" min="0" max="30" step="0.1" value="0"></label>
    <label>Fade de saída (s)<input id="propFadeOut" type="number" min="0" max="30" step="0.1" value="0"></label>
    <label><input id="propMuted" type="checkbox"> Silenciar esta camada</label>
    <label><input id="propReverse" type="checkbox"> Reproduzir ao contrário</label>
    <label>Transição de entrada<select id="propTransitionIn"><option value="none">Nenhuma</option><option value="fade">Fade</option><option value="slide-left">Deslizar da esquerda</option><option value="slide-right">Deslizar da direita</option><option value="zoom">Zoom</option></select></label>
    <label>Transição de saída<select id="propTransitionOut"><option value="none">Nenhuma</option><option value="fade">Fade</option><option value="slide-left">Deslizar à esquerda</option><option value="slide-right">Deslizar à direita</option><option value="zoom">Zoom</option></select></label>
    <label>Duração da transição (s)<input id="propTransitionDuration" type="number" min="0.1" max="10" step="0.1" value="0.5"></label>
  </div>
</template>

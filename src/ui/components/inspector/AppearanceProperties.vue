<template>
  <label>Recorte horizontal<input id="propCropX" type="range" min="0" max="49"><output id="outCropX"></output></label>
  <label>Recorte vertical<input id="propCropY" type="range" min="0" max="49"><output id="outCropY"></output></label>
  <label>Ajuste da mídia<select id="propFitMode"><option value="contain">Ajustar inteira (sem corte)</option><option value="cover">Preencher quadro (pode cortar)</option><option value="fill">Esticar ao quadro</option></select></label>
  <label><input id="propVisible" type="checkbox" checked> Camada visível</label>
  <label><input id="propLocked" type="checkbox"> Bloquear edição</label>
  <label><input id="propFlipX" type="checkbox"> Espelhar horizontalmente</label>
  <label><input id="propFlipY" type="checkbox"> Espelhar verticalmente</label>
  <label>Cor<input id="propColor" type="color" value="#ffffff"></label>
  <label>Preenchimento<select id="propFillType"><option value="solid">Cor sólida</option><option value="linear">Gradiente linear</option><option value="radial">Gradiente radial</option></select></label>
  <label>Cor final do gradiente<input id="propGradientColor" type="color" value="#7758ff"></label>
  <label>Ângulo do gradiente<input id="propGradientAngle" type="range" min="0" max="360"><output id="outGradientAngle"></output></label>
  <label>Entrada na composição (s)<input id="propStart" type="number" min="0" step="0.1"></label>
  <label>Saída na composição (s)<input id="propEnd" type="number" min="0" step="0.1"></label>
</template>

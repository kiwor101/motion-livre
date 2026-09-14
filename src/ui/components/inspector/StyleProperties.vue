<template>
  <label>Modo de mesclagem<select id="propBlend"><option value="normal">Normal</option><option value="multiply">Multiplicar</option><option value="screen">Tela</option><option value="overlay">Sobrepor</option><option value="lighten">Clarear</option><option value="darken">Escurecer</option><option value="color-dodge">Subexposição de cor</option><option value="color-burn">Superexposição de cor</option><option value="hard-light">Luz intensa</option><option value="soft-light">Luz suave</option><option value="difference">Diferença</option><option value="exclusion">Exclusão</option><option value="hue">Matiz</option><option value="saturation">Saturação</option><option value="color">Cor</option><option value="luminosity">Luminosidade</option></select></label>
  <label>Raio do canto<input id="propRadius" type="range" min="0" max="100"><output id="outRadius"></output></label>
  <label>Contorno<input id="propStroke" type="range" min="0" max="20"><output id="outStroke"></output></label>
  <label>Cor do contorno<input id="propStrokeColor" type="color" value="#000000"></label>
  <label>Fonte<select id="propFont"><option>Segoe UI</option><option>Arial</option><option>Georgia</option><option>Impact</option><option>Courier New</option></select></label>
  <label>Tamanho da fonte<input id="propFontSize" type="range" min="8" max="180"><output id="outFontSize"></output></label>
  <label>Máscara<select id="propMaskMode"><option value="none">Nenhuma</option><option value="inset">Retangular</option><option value="circle">Circular</option><option value="ellipse">Elíptica</option><option value="polygon">Polígono personalizado</option></select></label>
  <button id="editMaskPoints" class="wide">Editar máscara no palco</button>
  <button id="clearMaskPoints" class="wide">Limpar pontos da máscara</button>
  <input id="propMask" type="checkbox" hidden>
</template>

<template>
  <label class="full">Nome<input id="propName" type="text"></label>
  <div class="transform-grid">
    <label>◇ X<div class="unit-input"><span>X</span><input id="propX" type="number" min="0" step="1"></div><output id="outX"></output></label>
    <label>◇ Y<div class="unit-input"><span>Y</span><input id="propY" type="number" min="0" step="1"></div><output id="outY"></output></label>
    <label>◇ Escala<div class="unit-input"><span>S</span><input id="propScale" type="number" min="10" max="200" step="1"></div><output id="outScale"></output></label>
    <label>◇ Rotação<div class="unit-input"><span>°</span><input id="propRotation" type="number" min="-180" max="180" step="1"></div><output id="outRotation"></output></label>
    <label>Profundidade Z<div class="unit-input"><span>Z</span><input id="propDepth" type="number" min="-1000" max="1000" step="1"></div><output id="outDepth"></output></label>
    <label>Perspectiva<div class="unit-input"><span>P</span><input id="propPerspective" type="number" min="300" max="3000" step="1"></div><output id="outPerspective"></output></label>
    <label>Opacidade<div class="unit-input"><span>%</span><input id="propOpacity" type="number" min="0" max="100" step="1"></div><output id="outOpacity"></output></label>
    <label>Âncora X<div class="unit-input"><span>X</span><input id="propAnchorX" type="number" min="0" max="100" step="1"></div><output id="outAnchorX"></output></label>
    <label>Âncora Y<div class="unit-input"><span>Y</span><input id="propAnchorY" type="number" min="0" max="100" step="1"></div><output id="outAnchorY"></output></label>
  </div>
</template>

<style scoped>
.full{display:block}.transform-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.transform-grid label{min-width:0}.unit-input{height:30px;margin-top:5px;display:flex;align-items:center;border:1px solid var(--line);border-radius:5px;background:#242426;overflow:hidden}.unit-input span{padding-left:9px;color:#77777d;font-size:10px}.unit-input input{width:100%;min-width:0;height:28px;padding:0 8px;border:0!important;background:transparent!important;color:var(--text);outline:0}.full input{width:100%;height:30px;margin-top:5px;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#242426;color:var(--text)}output{display:none}
</style>

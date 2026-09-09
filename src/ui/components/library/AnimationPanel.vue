<template>
  <div id="panel-animation" class="panel">
    <h2>Animação</h2><p>Keyframes, curvas e relações entre camadas.</p>
    <label>Propriedade<select id="keyframeProperty"><option value="all">Todas as transformações</option><option value="x">Posição X</option><option value="y">Posição Y</option><option value="depth">Profundidade Z</option><option value="scale">Escala</option><option value="rotation">Rotação</option><option value="opacity">Opacidade</option></select></label>
    <label>Interpolação<select id="propEasing"><option value="linear">Linear</option><option value="ease-in">Acelerar</option><option value="ease-out">Desacelerar</option><option value="ease-in-out">Suave</option><option value="bounce">Rebote</option></select></label>
    <canvas id="easingGraph" width="220" height="110"></canvas>
    <label>Camada pai<select id="propParent"><option value="">Nenhuma</option></select></label>
    <button id="addNullLayer" class="wide">Adicionar objeto nulo</button>
    <button id="addCameraLayer" class="wide">Adicionar câmera 2.5D</button>
    <button id="precomposeLayers" class="wide">Precompor camadas marcadas</button>
    <button id="showMotionPath" class="wide">Exibir caminho de movimento</button>
  </div>
</template>

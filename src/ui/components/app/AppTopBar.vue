<template>
  <header class="topbar">
    <div class="brand"><span class="brand-mark">M</span><div><strong>Motion Livre</strong><small>editor desktop</small></div></div>
    <div class="project-name"><input id="projectName" value="Meu projeto"><span id="saveState">Salvo localmente</span></div>
    <div class="top-actions">
      <button id="undoBtn" class="ghost" title="Desfazer (Ctrl+Z)">↶</button>
      <button id="redoBtn" class="ghost" title="Refazer (Ctrl+Y)">↷</button>
      <button id="newProject" class="ghost">Novo</button>
      <button id="saveProject" class="ghost">Salvar projeto</button>
      <button id="projectFile" class="ghost">Projeto ▾</button>
      <button id="exportBtn" class="primary">Exportar MP4</button>
    </div>
  </header>
</template>

<template>
  <div class="project-name">
    <input id="projectName" value="Meu projeto" aria-label="Nome do projeto">
    <span id="saveState">Salvo localmente</span>
  </div>
</template>

<style scoped>
.project-name { min-width:0; margin-right:auto; text-align:left; }
.project-name input { width:auto; max-width:260px; height:32px; padding:4px 8px; border:1px solid transparent; border-radius:5px; background:transparent; color:var(--foreground); font-size:12px; font-weight:500; text-align:left; cursor:pointer; }
.project-name input:hover { background:var(--accent-bg); }
.project-name input:focus { border-color:var(--ring); background:transparent; cursor:text; }
.project-name span { display:none; }
@media (max-width:1100px) { .project-name input { max-width:145px; } }
</style>

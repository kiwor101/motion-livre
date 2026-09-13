interface PreviewFullscreenContext {toast(message:string):void}

const byId=<T extends HTMLElement>(id:string):T=>{const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T};

export function installPreviewFullscreenController(context:PreviewFullscreenContext):void {
  const previewWrap=document.querySelector<HTMLElement>('.stage-wrap'),previewArea=document.querySelector<HTMLElement>('.stage-area');if(!previewWrap||!previewArea)throw new Error('Área de preview ausente');const tools=document.createElement('div');tools.className='preview-tools';const button=document.createElement('button');button.id='previewFullscreen';button.title='Preview em tela cheia';button.setAttribute('aria-label',button.title);button.textContent='⛶';tools.append(button);previewWrap.append(tools);
  button.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{const bounds=byId('stage').getBoundingClientRect();previewArea.style.setProperty('--preview-ratio',String(bounds.width/bounds.height));await previewArea.requestFullscreen()}}catch{context.toast('Não foi possível abrir a tela cheia')}};
  document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===previewArea;button.title=active?'Sair da tela cheia (Esc)':'Preview em tela cheia';button.setAttribute('aria-label',button.title)});
}

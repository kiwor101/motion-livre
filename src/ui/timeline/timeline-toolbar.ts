export interface TimelineToolbar {tools:HTMLDivElement;beatButton:HTMLButtonElement;rangeStatus:HTMLOutputElement}

const button=(label:string,title:string,attributes:Record<string,string>):HTMLButtonElement=>{const element=document.createElement('button');element.textContent=label;element.title=title;for(const [name,value] of Object.entries(attributes))element.dataset[name]=value;return element};

export function createTimelineToolbar(container:HTMLElement):TimelineToolbar {
  const tools=document.createElement('div');tools.className='timeline-edit-tools';
  const actions:Array<[string,string,string]>=[['play','▶ / ❚❚','Reproduzir / pausar'],['split','✂ Dividir','Dividir no cursor'],['up','↑','Mover clipe para a faixa acima'],['down','↓','Mover clipe para a faixa abaixo'],['delete','Excluir','Excluir clipe'],['extract-audio','♫ Extrair áudio','Extrair o áudio do vídeo selecionado'],['duplicate','⧉ Duplicar','Duplicar em nova camada acima'],['freeze','❄ Congelar','Inserir 2 segundos do quadro atual'],['reverse','↶ Reverso','Reproduzir o clipe de trás para frente'],['flip','↔ Espelhar','Espelhar horizontalmente'],['range-in','[ In','Marcar início da renderização'],['range-out','Out ]','Marcar fim da renderização'],['trim-start','⇤ Trim início','Remover o espaço vazio antes do primeiro clipe'],['trim-end','Trim fim ⇥','Remover o espaço vazio depois do último clipe']];
  for(const [action,label,title] of actions){const element=button(label,title,{action});if(action==='reverse'||action==='flip')element.setAttribute('aria-pressed','false');tools.append(element)}
  const beatButton=button('♩ Beat sync','Gerar marcadores em uma grade de tempo',{tool:'beats'}),rangeStatus=document.createElement('output'),position=document.createElement('output');rangeStatus.className='render-range-status';position.id='timelinePosition';tools.append(beatButton,rangeStatus,position);container.prepend(tools);return{tools,beatButton,rangeStatus};
}

import type {History} from '../../core/history';
import {appendVectorPoint,setProperties,setVectorPoints} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {uiState} from '../ui-state';

type VectorKind='mask'|'path';
interface VectorEdit {kind:VectorKind;id:number}

interface VectorEditingContext {
  state:EditorState;
  history:History;
  snapshot():string;
  restore(snapshot:string):void;
  selected():Layer|null;
  addLayer(type:string,content:string,name:string):Layer;
  applyStyle(element:HTMLElement,layer:Layer):void;
  syncProps():void;
  updateSelected():void;
  renderLayers():void;
  replaceRenderLayers(callback:()=>void):void;
  selectLayer(id:number|null):void;
  replaceSelectLayer(callback:(id:number|null)=>void):void;
  renderTimeline():void;
  markDirty():void;
  toast(message:string):void;
}

const byId=<T extends HTMLElement>(id:string):T=>{
  const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T;
};
const layerElement=(id:number):HTMLElement|null=>document.querySelector<HTMLElement>(`.layer[data-id="${id}"]`);

const bezierPath=(points:Array<[number,number]>):string=>{
  if(!points.length)return'';if(points.length===1)return`M ${points[0][0]} ${points[0][1]}`;
  let path=`M ${points[0][0]} ${points[0][1]}`;
  for(let index=1;index<points.length-1;index++){const middle=[(points[index][0]+points[index+1][0])/2,(points[index][1]+points[index+1][1])/2];path+=` Q ${points[index][0]} ${points[index][1]} ${middle[0]} ${middle[1]}`}
  const last=points.at(-1);return last?`${path} T ${last[0]} ${last[1]}`:path;
};

export function installVectorEditingController(context:VectorEditingContext):void {
  let vectorEdit:VectorEdit|null=null;
  const syncVectorEditUi=()=>{uiState.maskEditing=vectorEdit?.kind==='mask';uiState.pathEditing=vectorEdit?.kind==='path';byId('editMaskPoints').textContent=uiState.maskEditing?'Clique no elemento · duplo clique encerra':'Editar máscara no palco';byId('startBezierPath').textContent=uiState.pathEditing?'Clique no palco · duplo clique encerra':'Caneta Bézier'};
  const finishVectorEdit=(commit:boolean):boolean=>{if(!vectorEdit)return false;const raw=commit?null:context.history.cancel();if(commit)context.history.commit(context.snapshot());vectorEdit=null;syncVectorEditUi();if(raw!==null)context.restore(raw);return true};
  const beginVectorEdit=(kind:VectorKind,id:number)=>{if(vectorEdit)finishVectorEdit(true);context.history.begin(context.snapshot());vectorEdit={kind,id};syncVectorEditUi()};

  const renderMaskOverlay=()=>{
    document.querySelector('.mask-path')?.remove();const layer=context.selected();if(!layer?.id||layer.maskMode!=='polygon'||layer.maskPoints.length<1)return;
    const element=layerElement(layer.id);if(!element)return;const stageBounds=byId('stage').getBoundingClientRect(),layerBounds=element.getBoundingClientRect();
    const points=layer.maskPoints.map(point=>[(layerBounds.left-stageBounds.left+layerBounds.width*point[0]/100)/stageBounds.width*100,(layerBounds.top-stageBounds.top+layerBounds.height*point[1]/100)/stageBounds.height*100] as [number,number]);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('mask-path');svg.setAttribute('viewBox','0 0 100 100');const polygon=document.createElementNS(svg.namespaceURI,'polygon');polygon.setAttribute('points',points.map(point=>point.join(',')).join(' '));svg.append(polygon);
    for(const point of points){const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',String(point[0]));dot.setAttribute('cy',String(point[1]));dot.setAttribute('r','1.2');svg.append(dot)}byId('stage').append(svg);
  };
  const renderVectorPaths=()=>{for(const layer of context.state.layers.filter(candidate=>candidate.type==='path')){if(!layer.id)continue;const element=layerElement(layer.id);if(!element)continue;element.classList.add('path-layer');element.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${bezierPath(layer.pathPoints||[])}" fill="none" stroke="${layer.color||'#fff'}" stroke-width="${Math.max(.3,layer.stroke||1)}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;context.applyStyle(element,layer)}};
  const addTransformHandles=()=>{const layer=context.selected();if(!layer?.id||layer.locked||layer.type==='audio')return;const element=layerElement(layer.id);if(!element)return;
    for(const kind of ['scale','rotate'] as const){const handle=document.createElement('i');handle.className=`transform-handle ${kind}`;handle.onpointerdown=event=>{event.preventDefault();event.stopPropagation();const bounds=byId('stage').getBoundingClientRect(),centerX=bounds.left+bounds.width*layer.x/100,centerY=bounds.top+bounds.height*layer.y/100,startScale=layer.scale,startRotation=layer.rotation,startDistance=Math.hypot(event.clientX-centerX,event.clientY-centerY)||1,startAngle=Math.atan2(event.clientY-centerY,event.clientX-centerX);context.history.begin(context.snapshot());
      const move=(pointer:PointerEvent)=>{const values=kind==='scale'?{scale:Math.max(5,Math.min(800,startScale*Math.hypot(pointer.clientX-centerX,pointer.clientY-centerY)/startDistance))}:{rotation:startRotation+(Math.atan2(pointer.clientY-centerY,pointer.clientX-centerX)-startAngle)*180/Math.PI};setProperties(context.state,{id:layer.id!,values});context.updateSelected();context.syncProps()};
      const up=(pointer:PointerEvent)=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);if(pointer.type==='pointercancel'){setProperties(context.state,{id:layer.id!,values:{scale:startScale,rotation:startRotation}});context.history.cancel();context.updateSelected();context.syncProps()}else context.history.commit(context.snapshot());context.markDirty()};
      addEventListener('pointermove',move);addEventListener('pointerup',up);addEventListener('pointercancel',up);
    };element.append(handle)}
  };

  document.addEventListener('motion:beforehistorygesture',()=>finishVectorEdit(true));
  byId<HTMLButtonElement>('editMaskPoints').onclick=()=>{const layer=context.selected();if(!layer?.id)return context.toast('Selecione uma camada');if(vectorEdit?.kind==='mask'&&vectorEdit.id===layer.id){finishVectorEdit(true);return}if(layer.locked)return context.toast('Desbloqueie a camada para editar a máscara');beginVectorEdit('mask',layer.id);setProperties(context.state,{id:layer.id,values:{maskMode:'polygon'}});context.renderLayers();context.selectLayer(layer.id)};
  byId<HTMLButtonElement>('clearMaskPoints').onclick=()=>{const layer=context.selected();if(!layer?.id)return;if(vectorEdit)finishVectorEdit(true);setVectorPoints(context.state,{id:layer.id,kind:'mask',points:[]});setProperties(context.state,{id:layer.id,values:{maskMode:'none'}});context.renderLayers();context.selectLayer(layer.id);context.markDirty()};
  const stage=byId('stage');stage.addEventListener('pointerdown',event=>{if(vectorEdit?.kind!=='mask')return;const layer=context.state.layers.find(candidate=>candidate.id===vectorEdit?.id);if(!layer?.id)return;const element=layerElement(layer.id);if(!element)return;event.preventDefault();event.stopPropagation();const bounds=element.getBoundingClientRect();appendVectorPoint(context.state,{id:layer.id,kind:'mask',point:[Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100)),Math.max(0,Math.min(100,(event.clientY-bounds.top)/bounds.height*100))]});context.applyStyle(element,layer);renderMaskOverlay();context.markDirty()},true);
  stage.addEventListener('dblclick',event=>{if(vectorEdit?.kind!=='mask')return;event.preventDefault();finishVectorEdit(true);context.toast('Máscara personalizada concluída')},true);
  byId<HTMLButtonElement>('startBezierPath').onclick=()=>{let layer=context.selected();if(vectorEdit?.kind==='path'&&layer?.id===vectorEdit.id){finishVectorEdit(true);return}if(vectorEdit)finishVectorEdit(true);context.history.begin(context.snapshot());if(!layer||layer.type!=='path'){layer=context.addLayer('path','',`Caminho Bézier ${context.state.layers.filter(candidate=>candidate.type==='path').length+1}`);if(!layer.id){context.history.cancel();return}setVectorPoints(context.state,{id:layer.id,kind:'path',points:[]});setProperties(context.state,{id:layer.id,values:{x:50,y:50,scale:100,stroke:2}})}else if(layer.locked){context.history.cancel();return context.toast('Desbloqueie a camada para editar o caminho')}if(!layer.id){context.history.cancel();return}vectorEdit={kind:'path',id:layer.id};syncVectorEditUi();context.renderLayers();context.selectLayer(layer.id)};
  stage.addEventListener('pointerdown',event=>{if(vectorEdit?.kind!=='path')return;const layer=context.state.layers.find(candidate=>candidate.id===vectorEdit?.id);if(!layer?.id)return;event.preventDefault();event.stopPropagation();const bounds=stage.getBoundingClientRect();appendVectorPoint(context.state,{id:layer.id,kind:'path',point:[(event.clientX-bounds.left)/bounds.width*100,(event.clientY-bounds.top)/bounds.height*100]});renderVectorPaths();context.markDirty()},true);
  stage.addEventListener('dblclick',event=>{if(vectorEdit?.kind!=='path')return;event.preventDefault();finishVectorEdit(true);context.toast('Caminho Bézier concluído')},true);
  addEventListener('keydown',event=>{if(event.key!=='Escape'||!vectorEdit)return;event.preventDefault();finishVectorEdit(false);context.toast('Edição vetorial cancelada')});

  const originalRenderLayers=context.renderLayers;context.replaceRenderLayers(()=>{originalRenderLayers();renderVectorPaths();addTransformHandles();renderMaskOverlay()});
  const originalSelectLayer=context.selectLayer;context.replaceSelectLayer(id=>{originalSelectLayer(id);document.querySelectorAll('.transform-handle').forEach(element=>element.remove());addTransformHandles();context.renderTimeline();renderMaskOverlay()});
  const newProject=byId<HTMLButtonElement>('newProject'),originalNewProject=newProject.onclick;newProject.onclick=event=>{finishVectorEdit(true);originalNewProject?.call(newProject,event);context.renderTimeline()};
}

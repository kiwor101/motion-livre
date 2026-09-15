import type {EditorState} from './editor-state';
import type {LayerId} from './project-model';

const existing=(state:EditorState,ids:Iterable<LayerId>):LayerId[]=>{
  const available=new Set(state.layers.flatMap(layer=>layer.id===undefined?[]:[layer.id]));
  return [...new Set(ids)].filter(id=>available.has(id));
};

export function selectOnly(state:EditorState,id:LayerId|null|undefined):LayerId|null {
  const selected=id==null?null:existing(state,[id])[0]??null;
  state.selection.selected=selected;state.selection.selectedIds.clear();return selected;
}

export function clearMultiple(state:EditorState):void {state.selection.selectedIds.clear()}

export function setMany(state:EditorState,{ids,additive=false,primary}:{ids:Iterable<LayerId>;additive?:boolean;primary?:LayerId|null}):LayerId|null {
  const values=existing(state,ids);if(!additive)state.selection.selectedIds.clear();for(const id of values)state.selection.selectedIds.add(id);
  const preferred=primary==null?values.at(-1):existing(state,[primary])[0];
  if(preferred!==undefined)state.selection.selected=preferred;
  else if(!additive)state.selection.selected=[...state.selection.selectedIds].at(-1)??null;
  return state.selection.selected;
}

export function toggle(state:EditorState,id:LayerId):LayerId|null {
  if(!existing(state,[id]).length)return state.selection.selected;
  if(!state.selection.selectedIds.size&&state.selection.selected!==null)state.selection.selectedIds.add(state.selection.selected);
  if(state.selection.selectedIds.has(id))state.selection.selectedIds.delete(id);else state.selection.selectedIds.add(id);
  state.selection.selected=state.selection.selectedIds.has(id)?id:[...state.selection.selectedIds].at(-1)??null;return state.selection.selected;
}

export function selectRange(state:EditorState,{order,anchor,target,additive=false}:{order:LayerId[];anchor:LayerId;target:LayerId;additive?:boolean}):LayerId|null {
  const valid=existing(state,order),from=valid.indexOf(anchor),to=valid.indexOf(target);if(from<0||to<0)return selectOnly(state,target);
  return setMany(state,{ids:valid.slice(Math.min(from,to),Math.max(from,to)+1),additive,primary:target});
}

export function toggleMany(state:EditorState,ids:Iterable<LayerId>):LayerId|null {
  const values=existing(state,ids),remove=values.length>0&&values.every(id=>state.selection.selectedIds.has(id));
  for(const id of values)if(remove)state.selection.selectedIds.delete(id);else state.selection.selectedIds.add(id);
  if(state.selection.selected!==null&&!state.layers.some(layer=>layer.id===state.selection.selected))state.selection.selected=null;
  if(state.selection.selected===null&&!remove)state.selection.selected=values.at(-1)??null;
  return state.selection.selected;
}

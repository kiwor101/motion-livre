import {moveClip} from './clip-commands';
import {trackIdFor} from './layer-commands';
import type {EditorState,ProjectState} from './editor-state';
import type {LayerId,TrackId} from './project-model';

export interface RippleInsertionPlan {trackId:TrackId;at:number;shift:number;shiftedIds:LayerId[]}

// Insertion is offered only at a boundary between two existing clips.
export function planRippleInsertion(state:ProjectState,{id,trackId,at,tolerance=0}:{id:LayerId;trackId:TrackId;at:number;tolerance?:number}):RippleInsertionPlan|null {
  const source=state.layers.find(layer=>layer.id===id);
  if(!source||source.locked||!Number.isFinite(at)||!Number.isFinite(source.start)||!Number.isFinite(source.end)||source.end<=source.start)return null;
  const members=state.layers.filter(layer=>layer!==source&&trackIdFor(layer)===trackId).sort((a,b)=>a.start-b.start);
  const right=members.find(layer=>Math.abs(layer.start-at)<=tolerance);
  if(!right||!members.some(layer=>layer.end<=right.start+.00001))return null;
  const suffix=members.filter(layer=>layer.start>=right.start-.00001),shift=source.end-source.start;
  if(members.some(layer=>layer.locked)||suffix.some(layer=>layer.end+shift>3600))return null;
  return{trackId,at:right.start,shift,shiftedIds:suffix.flatMap(layer=>layer.id===undefined?[]:[layer.id])};
}

export function insertClipWithRipple(state:EditorState,{id,plan}:{id:LayerId;plan:RippleInsertionPlan}):boolean {
  const checked=planRippleInsertion(state,{id,trackId:plan.trackId,at:plan.at});
  if(!checked||Math.abs(checked.shift-plan.shift)>.00001||checked.shiftedIds.length!==plan.shiftedIds.length||checked.shiftedIds.some((value,index)=>value!==plan.shiftedIds[index]))return false;
  const source=state.layers.find(layer=>layer.id===id)!;
  const moved=moveClip(source,checked.at,state.duration),shifted=new Set(checked.shiftedIds);
  if(trackIdFor(source)!==checked.trackId){const target=state.layers.find(layer=>trackIdFor(layer)===checked.trackId);if(!target)return false;moved.trackId=checked.trackId;moved.trackName=target.trackName||target.name}
  const next=state.layers.filter(layer=>layer!==source).map(layer=>layer.id!==undefined&&shifted.has(layer.id)?moveClip(layer,layer.start+checked.shift,state.duration):layer);
  const insertion=trackIdFor(source)===checked.trackId?Math.min(state.layers.indexOf(source),next.length):next.findIndex(layer=>trackIdFor(layer)===checked.trackId);
  next.splice(Math.max(0,insertion),0,moved);
  state.layers=next;
  return true;
}

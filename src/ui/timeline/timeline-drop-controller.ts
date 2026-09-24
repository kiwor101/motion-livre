import {trackIdFor} from '../../core/layer-commands';
import type {EditorState} from '../../core/editor-state';
import type {TrackId} from '../../core/project-model';
import type {RippleInsertionPlan} from '../../core/ripple-insertion';

export interface NewTrackTarget {target:TrackId;before:boolean}
export interface DropTarget {row:HTMLElement|null;destination:TrackId|null;newTrack:NewTrackTarget|null}

const trackIdForRow=(state:EditorState,row:HTMLElement):TrackId|null=>{
  const value=row.dataset.track;
  return state.layers.map(trackIdFor).find(id=>id!==null&&String(id)===value)??null;
};

export function resolveDropTarget(state:EditorState,timeline:HTMLElement,pointer:PointerEvent,startY:number,originalTrack:TrackId|null):DropTarget {
  const row=document.elementFromPoint(pointer.clientX,pointer.clientY)?.closest<HTMLElement>('.track')||null;
  const destination=row?trackIdForRow(state,row):originalTrack;
  let newTrack:NewTrackTarget|null=null;
  if(Math.abs(pointer.clientY-startY)>8){
    const rows=[...timeline.querySelectorAll<HTMLElement>('.track')];
    const near=rows.find(candidate=>{const bounds=candidate.getBoundingClientRect();return Math.abs(pointer.clientY-bounds.top)<9||Math.abs(pointer.clientY-bounds.bottom)<9});
    if(near){const bounds=near.getBoundingClientRect(),target=trackIdForRow(state,near);if(target!==null)newTrack={target,before:Math.abs(pointer.clientY-bounds.top)<Math.abs(pointer.clientY-bounds.bottom)}}
    else if(rows.length&&pointer.clientY>rows.at(-1)!.getBoundingClientRect().bottom){const target=trackIdForRow(state,rows.at(-1)!);if(target!==null)newTrack={target,before:false}}
    else if(rows.length&&pointer.clientY<rows[0].getBoundingClientRect().top){const target=trackIdForRow(state,rows[0]);if(target!==null)newTrack={target,before:true}}
  }
  return{row,destination,newTrack};
}

export function createTimelineDropFeedback(timeline:HTMLElement,headerWidth:number){
  const show=(detail:{left:number;top:number;height:number;newTrack:boolean;invalid:boolean;label:string}|null)=>window.dispatchEvent(new CustomEvent('motion:timeline-drop',{detail}));
  let shifted=new Set<number>(),activeRow:HTMLElement|null=null;
  const clearShift=()=>{for(const id of shifted){const element=timeline.querySelector<HTMLElement>(`[data-clip="${id}"]`);if(element){element.style.transform='';element.classList.remove('ripple-shift')}}shifted=new Set()};
  const update=({target,plan,valid,pixelsPerSecond}:{target:DropTarget;plan:RippleInsertionPlan|null;valid:boolean;pixelsPerSecond:number})=>{
    const nextShifted=new Set(plan?.shiftedIds||[]);
    for(const id of shifted)if(!nextShifted.has(id)){const element=timeline.querySelector<HTMLElement>(`[data-clip="${id}"]`);if(element){element.style.transform='';element.classList.remove('ripple-shift')}}
    shifted=nextShifted;
    if(activeRow!==target.row){activeRow?.classList.remove('drop-target');activeRow=target.row;activeRow?.classList.add('drop-target')}
    const rows=[...timeline.querySelectorAll<HTMLElement>('.track')];
    const row=target.newTrack?rows.find(candidate=>candidate.dataset.track===String(target.newTrack!.target)):target.row;
    if(row){
      const bounds=row.getBoundingClientRect(),timelineBounds=timeline.getBoundingClientRect(),top=bounds.top-timelineBounds.top+timeline.scrollTop;
      show({left:headerWidth,top:target.newTrack?top+(target.newTrack.before?0:bounds.height)-2:top+2,height:target.newTrack?4:Math.max(8,bounds.height-4),newTrack:Boolean(target.newTrack),invalid:!valid,label:target.newTrack?'Nova camada':plan?`Inserir · deslocar ${plan.shiftedIds.length} clipe(s)`:'Mover para esta camada'});
    }else show(null);
    if(plan)for(const id of shifted){const element=timeline.querySelector<HTMLElement>(`[data-clip="${id}"]`);if(element){element.classList.add('ripple-shift');element.style.transform=`translateX(${plan.shift*pixelsPerSecond}px)`}}
  };
  const remove=()=>{clearShift();show(null);activeRow?.classList.remove('drop-target');activeRow=null};
  return{update,remove};
}

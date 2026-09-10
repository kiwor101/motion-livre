import type {Layer,LayerId} from './project-model';

export interface Composition {
  width:number;
  height:number;
  fps:number;
  background:string;
}

export interface RenderRange {start:number;end:number}
export interface BeatSync {bpm:number;offset:number}
export interface AlightSceneMetadata {attributes:Record<string,string>}
export interface MediaLibraryEntry extends Record<string,unknown> {
  type:string;
  url:string;
  name:string;
  sourcePath?:string;
  duration?:number;
  width?:number;
  height?:number;
  rotation?:number;
  hasAudio?:boolean;
  waveform?:number[];
}

export interface ProjectState extends Record<string,unknown> {
  layers:Layer[];
  duration:number;
  composition:Composition;
  renderRange:RenderRange;
  mediaLibrary:MediaLibraryEntry[];
  markers:number[];
  beatMarkers:number[];
  beatSync:BeatSync;
  alightScene?:AlightSceneMetadata;
}
export interface SelectionState {selected:LayerId|null;selectedIds:Set<LayerId>}
export interface PlaybackState {time:number;playing:boolean;started:number;audio:unknown;previewMuted:boolean}

export interface EditorState extends ProjectState {
  selection:SelectionState;
  playback:PlaybackState;
}

export type EditorStateOverrides=Partial<ProjectState>&{selection?:Partial<SelectionState>;playback?:Partial<PlaybackState>};
export type EditorStateSnapshot=Omit<EditorState,'selection'>&{selection:{selected:LayerId|null;selectedIds:LayerId[]}};

export function create(overrides:EditorStateOverrides={}):EditorState {
  const {selection:selectionOverride,playback:playbackOverride,...projectOverrides}=overrides;
  const selection:SelectionState={selected:selectionOverride?.selected??null,selectedIds:selectionOverride?.selectedIds??new Set<LayerId>()};
  const playback:PlaybackState={time:playbackOverride?.time??0,playing:playbackOverride?.playing??false,started:playbackOverride?.started??0,audio:playbackOverride?.audio??null,previewMuted:playbackOverride?.previewMuted??false};
  return{layers:[],duration:10,composition:{width:1920,height:1080,fps:30,background:'#08090b'},renderRange:{start:0,end:10},mediaLibrary:[],markers:[],beatMarkers:[],beatSync:{bpm:120,offset:0},...projectOverrides,selection,playback};
}

export function replace(target:EditorState,next:EditorStateOverrides):EditorState {
  for(const key of Object.keys(target))delete target[key];
  const replacement=create(next);
  Object.assign(target,replacement);
  return target;
}

export function snapshot(state:EditorState):EditorStateSnapshot {
  const serializable={...state,selection:{selected:state.selection.selected,selectedIds:[...state.selection.selectedIds]},playback:{...state.playback}};
  return JSON.parse(JSON.stringify(serializable)) as EditorStateSnapshot;
}

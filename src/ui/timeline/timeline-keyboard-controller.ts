import type {EditorState} from '../../core/editor-state';

export function handleTimelineArrow(event:KeyboardEvent,state:EditorState,stop:()=>void,setTime:(time:number)=>void):boolean {
  if(event.ctrlKey||event.altKey||event.metaKey||!['ArrowLeft','ArrowRight'].includes(event.key))return false;
  const field=event.target instanceof Element?event.target.closest('input,textarea,select,[contenteditable="true"]'):null;
  if(field&&!(field instanceof HTMLInputElement&&['checkbox','radio'].includes(field.type)))return false;
  event.preventDefault();stop();setTime(state.playback.time+(event.key==='ArrowRight'?1:-1)/(state.composition.fps||30));
  return true;
}

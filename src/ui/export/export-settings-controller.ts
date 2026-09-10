import {setRenderRange} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import type {ExportFormat,ExportSettingsInput} from '../../core/export-settings';

interface ExportSettingsContext {
  state:EditorState;
  toast(message:string):void;
}

type NativeExport=(format:ExportFormat,settings?:ExportSettingsInput)=>Promise<unknown>;

const byId=<T extends HTMLElement>(id:string):T=>{
  const element=document.getElementById(id);
  if(!element)throw new Error(`Elemento ausente: ${id}`);
  return element as T;
};

const input=(id:string)=>byId<HTMLInputElement>(id);

export function installExportSettingsController(context:ExportSettingsContext):void {
  const {state}=context;
  const nativeExport=(window as Window&{motionNativeExport?:NativeExport}).motionNativeExport;
  let pendingFormat:ExportFormat='mp4';
  const formatNames:Record<ExportFormat,string>={mp4:'MP4 · H.264 + AAC',mov:'MOV · H.264 + AAC',webm:'WebM',gif:'GIF animado',png:'Imagem PNG',mp3:'Somente áudio MP3'};

  const applyPreset=(value:string):void=>{
    const aspect=(state.composition.width||1920)/(state.composition.height||1080);
    if(value==='source'){
      input('exportWidth').value=String(state.composition.width);
      input('exportHeight').value=String(state.composition.height);
      return;
    }
    const short=Number(value);
    const width=aspect>=1?Math.round(short*aspect/2)*2:short;
    const height=aspect>=1?short:Math.round(short/aspect/2)*2;
    input('exportWidth').value=String(width);
    input('exportHeight').value=String(height);
  };

  byId('exportBtn').onclick=()=>{const menu=byId('exportMenu');menu.hidden=!menu.hidden};
  document.querySelectorAll<HTMLElement>('[data-export-format]').forEach(button=>{
    button.onclick=()=>{
      const format=button.dataset.exportFormat as ExportFormat|undefined;
      if(!format||!Object.hasOwn(formatNames,format))return;
      pendingFormat=format;
      byId('exportMenu').hidden=true;
      input('exportFormatLabel').value=formatNames[pendingFormat];
      input('exportFps').value=String(state.composition.fps);
      input('exportStart').value=String(state.renderRange.start||0);
      input('exportEnd').value=String(state.renderRange.end??state.duration);
      applyPreset(input('exportPreset').value);
      const transparent=input('exportTransparent');transparent.disabled=!['webm','png'].includes(pendingFormat);if(transparent.disabled)transparent.checked=false;
      byId('exportSettings').hidden=false;
    };
  });
  input('exportPreset').onchange=event=>applyPreset((event.currentTarget as HTMLInputElement).value);
  byId('closeExportSettings').onclick=()=>{byId('exportSettings').hidden=true};
  byId('startConfiguredExport').onclick=async()=>{
    const start=Number(input('exportStart').value),end=Number(input('exportEnd').value);
    const settings:ExportSettingsInput={width:Number(input('exportWidth').value),height:Number(input('exportHeight').value),fps:Number(input('exportFps').value),quality:Number(input('exportQuality').value),audioBitrate:input('exportAudioBitrate').value,start,end,transparent:input('exportTransparent').checked};
    try{if(!setRenderRange(state,{start,end}))return context.toast('O fim da exportação deve ser maior que o início')}
    catch(error){return context.toast(error instanceof Error?error.message:String(error))}
    byId('exportSettings').hidden=true;
    if(nativeExport)await nativeExport(pendingFormat,settings).catch(()=>undefined);
  };
}

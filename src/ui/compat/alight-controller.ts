/* Interoperabilidade clean-room com o formato público de cenas XML do Alight Motion. */
import {applyImportedProject} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import {emitCompatibilityReport} from './compatibility-report-event';
import type {AlightReport} from './alight-types';
import {exportAlightScene} from './alight-scene-export';
import {importAlightScene} from './alight-scene-import';
import {MAX_XML_SIZE} from './alight-xml-utils';

interface AlightApi {
  importScene(xml: string, options?: { silent?: boolean }): AlightReport;
  exportScene(): string;
  lastExportReport: AlightReport | null;
}

export interface AlightControllerContext {
  state:EditorState;
  uid:number;
  syncComposition():void;
  renderLayers():void;
  syncProps():void;
  setTime(time:number):void;
  pushHistory():void;
  markDirty():void;
  toast(message:string):void;
}

interface AlightDesktopBridge {
  fileUrl?(path:string):string;
  saveAlight?(data:string,suggestedName:string):Promise<string|null>;
  openAlight?():Promise<{data:string}|null>;
  onMenu?(name:string,callback:()=>void):void;
}

export function installAlightController(context:AlightControllerContext):void {
  'use strict';

  const activeContext=context;
  const state=activeContext.state;
  const desktop=window.motionDesktop as AlightDesktopBridge|undefined;
  const $=<T extends HTMLElement=HTMLElement>(selector:string):T=>{
    const element=document.querySelector<T>(selector);
    if(!element)throw new Error(`Elemento ausente: ${selector}`);
    return element;
  };
  const toast=(message:string)=>activeContext.toast(message);

  function fileUri(path:string|undefined):string {
    if(!path)return '';
    if(desktop?.fileUrl)return desktop.fileUrl(path);
    return 'file:///'+String(path)
      .replace(/\\/g,'/')
      .split('/')
      .map(encodeURIComponent)
      .join('/');
  }

  function importScene(xml:string,options:{silent?:boolean}={}):AlightReport {
    const imported=importAlightScene({
      xml,
      firstLayerId:activeContext.uid,
      fileUri,
    });
    applyImportedProject(state,{project:imported.project});
    activeContext.uid=imported.nextLayerId;
    $<HTMLInputElement>('#projectName').value=imported.title;
    $<HTMLSelectElement>('#aspect').value=imported.aspect;
    activeContext.syncComposition();
    activeContext.renderLayers();
    activeContext.syncProps();
    activeContext.setTime(0);
    activeContext.pushHistory();
    activeContext.markDirty();
    if(!options.silent)showReport(imported.report,'import');
    return imported.report;
  }

  function exportScene():string {
    const result=exportAlightScene({
      state,
      title:$<HTMLInputElement>('#projectName').value||'Projeto Motion Livre',
      fileUri,
    });
    api.lastExportReport=result.report;
    return result.xml;
  }

  function showReport(report:AlightReport,mode:'export'|'import'):void {
    emitCompatibilityReport({
      mode,
      layers:report.layers,
      keyframes:report.keyframes,
      sourceVersion:String(report.sourceVersion),
      unsupportedEffects:[...report.unsupportedEffects].slice(0,30),
      unresolvedMedia:(report.unresolvedMedia||[]).slice(0,30),
    });
    $('#compatReport').hidden=false;
  }

  async function saveScene(){
    try{
      const xml=exportScene();
      const name=$<HTMLInputElement>('#projectName').value||'cena';
      if(desktop?.saveAlight){
        const path=await desktop.saveAlight(xml,name);
        if(!path)return;
      }else{
        const anchor=document.createElement('a');
        anchor.href=URL.createObjectURL(new Blob([xml],{type:'application/xml'}));
        anchor.download=`${name}.xml`;
        anchor.click();
      }
      if(api.lastExportReport)showReport(api.lastExportReport,'export');
      toast('Cena XML compatível exportada');
    }catch(error){
      console.error(error);
      toast(`Falha no XML: ${error instanceof Error?error.message:String(error)}`);
    }
  }

  async function openScene(){
    try{
      if(desktop?.openAlight){
        const result=await desktop.openAlight();
        if(result)importScene(result.data);
      }else{
        $('#importAlightXml').click();
      }
    }catch(error){
      console.error(error);
      toast(`Falha no XML: ${error instanceof Error?error.message:String(error)}`);
    }
  }

  const api:AlightApi={importScene,exportScene,lastExportReport:null};
  $('#exportAlightXml').onclick=()=>{void saveScene()};
  $('#menuExportAlight').onclick=()=>{void saveScene()};
  $('#menuImportAlight').onclick=()=>{void openScene()};
  $<HTMLInputElement>('#importAlightXml').onchange=async event=>{
    const input=event.currentTarget as HTMLInputElement;
    const file=input.files?.[0];
    if(!file)return;
    try{
      if(file.size>MAX_XML_SIZE){
        throw new Error('O XML excede o limite de 10 MB');
      }
      importScene(await file.text());
    }catch(error){
      console.error(error);
      toast(`Falha no XML: ${error instanceof Error?error.message:String(error)}`);
    }finally{
      input.value='';
    }
  };
  $('#closeCompatReport').onclick=$('#acceptCompatReport').onclick=()=>{
    $('#compatReport').hidden=true;
  };
  if(desktop?.onMenu){
    desktop.onMenu('alight-open',()=>{void openScene()});
    desktop.onMenu('alight-save',()=>{void saveScene()});
  }

  window.alightCompat=api;
}

import type {ProjectState} from '../core/editor-state';
import {create as createRasterizer,type RasterMediaSource} from './rasterizer';
import {create as createWebGL} from './webgl-presenter';

export interface CompositionEngine {
  render(project:ProjectState,time:number,width:number,height:number,transparent?:boolean):boolean;
  readFrame(bytes:Uint8Array):Uint8Array;
  destroy():void;
  readonly canvas:HTMLCanvasElement;
  readonly backend:'webgl2-compositor'|'canvas2d-fallback';
  onRestored(callback:()=>void):(()=>void)|undefined;
  clearCache():void;
  readonly lost:boolean;
  readonly textureCount:number;
  readonly rasterBytes:number;
}

export function create({document,media,viewport,canvas=document.createElement('canvas')}:{document:Document;media:RasterMediaSource;viewport:()=>DOMRect;canvas?:HTMLCanvasElement}):CompositionEngine {
  const gpu=createWebGL(canvas),context=gpu?null:canvas.getContext('2d');if(!gpu&&!context)throw new Error('Canvas 2D indisponível');
  const rasterizer=createRasterizer({document,media,viewport}),scratch=document.createElement('canvas');let destroyed=false,alpha=false;
  function* layers(project:ProjectState,time:number,width:number,height:number):Generator<HTMLCanvasElement> {if(scratch.width!==width)scratch.width=width;if(scratch.height!==height)scratch.height=height;const scratchContext=scratch.getContext('2d');if(!scratchContext)throw new Error('Canvas de rasterização indisponível');for(const layer of project.layers){if(['audio','null','camera'].includes(layer.type)||layer.visible===false||time<layer.start||time>=layer.end)continue;rasterizer.draw(scratchContext,scratch,time,project,true,[layer]);yield scratch}}
  function render(project:ProjectState,time:number,width:number,height:number,transparent=false):boolean {if(destroyed)throw new Error('Compositor encerrado');alpha=transparent;if(canvas.width!==width||canvas.height!==height){if(gpu)gpu.resize(width,height);else{canvas.width=width;canvas.height=height}}if(!gpu){rasterizer.draw(context!,canvas,time,project,transparent);return true}const hex=project.composition.background||'#08090b',background:[number,number,number,number]=transparent?[0,0,0,0]:[parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255,1];return gpu.compose(layers(project,time,width,height),background)}
  let row=new Uint8Array(0);
  function readFrame(bytes:Uint8Array):Uint8Array {if(gpu){gpu.readPixels(bytes);const stride=canvas.width*4;if(row.length!==stride)row=new Uint8Array(stride);for(let y=0;y<Math.floor(canvas.height/2);y++){const top=y*stride,bottom=(canvas.height-1-y)*stride;row.set(bytes.subarray(top,top+stride));bytes.copyWithin(top,bottom,bottom+stride);bytes.set(row,bottom)}}else bytes.set(context!.getImageData(0,0,canvas.width,canvas.height).data);if(gpu&&alpha)for(let index=0;index<bytes.length;index+=4){const value=bytes[index+3];if(value&&value<255){bytes[index]=Math.min(255,Math.round(bytes[index]*255/value));bytes[index+1]=Math.min(255,Math.round(bytes[index+1]*255/value));bytes[index+2]=Math.min(255,Math.round(bytes[index+2]*255/value))}}return bytes}
  function destroy():void {if(destroyed)return;destroyed=true;gpu?.destroy();scratch.width=scratch.height=1;canvas.width=canvas.height=1}
  return{render,readFrame,destroy,canvas,backend:gpu?'webgl2-compositor':'canvas2d-fallback',onRestored:callback=>gpu?.onRestored(callback),clearCache:()=>gpu?.clearCache(),get lost(){return gpu?.lost||false},get textureCount(){return gpu?.textureCount||0},get rasterBytes(){return scratch.width*scratch.height*4}};
}

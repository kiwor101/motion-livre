export type TextureSource=HTMLCanvasElement|HTMLVideoElement|HTMLImageElement|ImageBitmap|OffscreenCanvas;
export interface WebGLPresenterOptions {maxTextures?:number;preserveDrawingBuffer?:boolean}
export interface WebGLPresenter {
  readonly backend:'webgl2';
  resize(width:number,height:number):void;
  present(source:TextureSource):boolean;
  compose(sources:Iterable<TextureSource>,background?:[number,number,number,number]):boolean;
  readPixels(bytes:Uint8Array):void;
  release(source:TextureSource):void;
  clearCache():void;
  destroy():void;
  onRestored(callback:()=>void):()=>void;
  readonly lost:boolean;
  readonly textureCount:number;
}

function compile(gl:WebGL2RenderingContext,type:number,source:string):WebGLShader {
  const shader=gl.createShader(type);if(!shader)throw new Error('Não foi possível criar shader');
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader)||'Falha ao compilar shader';gl.deleteShader(shader);throw new Error(message)}
  return shader;
}

function dimensions(source:TextureSource):[number,number] {
  if(source instanceof HTMLVideoElement)return[source.videoWidth,source.videoHeight];
  if(source instanceof HTMLImageElement)return[source.naturalWidth,source.naturalHeight];
  return[source.width,source.height];
}

export function create(canvas:HTMLCanvasElement,{maxTextures=64,preserveDrawingBuffer=false}:WebGLPresenterOptions={}):WebGLPresenter|null {
  const context=canvas.getContext('webgl2',{alpha:true,antialias:false,preserveDrawingBuffer,powerPreference:'high-performance'});if(!context)return null;const gl:WebGL2RenderingContext=context;
  let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null,position=-1,destroyed=false,lost=false,width=canvas.width||1,height=canvas.height||1,frame=0;
  const textures=new Map<TextureSource,{texture:WebGLTexture;width:number;height:number;used:number}>(),restoredListeners=new Set<()=>void>();
  function disposeResources():void {for(const entry of textures.values())gl.deleteTexture(entry.texture);textures.clear();if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);buffer=null;program=null;position=-1}
  function initialize():void {
    disposeResources();
    const vertex=compile(gl,gl.VERTEX_SHADER,'#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=vec2((p.x+1.0)*.5,1.0-(p.y+1.0)*.5);gl_Position=vec4(p,0,1);}'),fragment=compile(gl,gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float;uniform sampler2D frame;in vec2 uv;out vec4 color;void main(){color=texture(frame,uv);}');
    program=gl.createProgram();if(!program)throw new Error('Não foi possível criar programa WebGL2');
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Falha ao ligar programa WebGL2');
    buffer=gl.createBuffer();if(!buffer)throw new Error('Não foi possível criar buffer WebGL2');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.useProgram(program);position=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);gl.uniform1i(gl.getUniformLocation(program,'frame'),0);gl.viewport(0,0,width,height);
  }
  function trimTextureCache():void {for(const[source,entry]of textures)if(frame-entry.used>120){gl.deleteTexture(entry.texture);textures.delete(source)}if(textures.size<=maxTextures)return;for(const[source,entry]of[...textures.entries()].sort((a,b)=>a[1].used-b[1].used).slice(0,textures.size-maxTextures)){gl.deleteTexture(entry.texture);textures.delete(source)}}
  function textureFor(source:TextureSource):WebGLTexture|null {
    let entry=textures.get(source);const[sourceWidth,sourceHeight]=dimensions(source);if(!sourceWidth||!sourceHeight)return null;
    if(!entry){const texture=gl.createTexture();if(!texture)throw new Error('Não foi possível criar textura WebGL2');entry={texture,width:0,height:0,used:frame};textures.set(source,entry);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}else gl.bindTexture(gl.TEXTURE_2D,entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);if(entry.width===sourceWidth&&entry.height===sourceHeight)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);entry.width=sourceWidth;entry.height=sourceHeight}entry.used=frame;return entry.texture;
  }
  const draw=(source:TextureSource):void=>{if(textureFor(source))gl.drawArrays(gl.TRIANGLES,0,6)};
  const api:WebGLPresenter={backend:'webgl2',resize(nextWidth,nextHeight){width=Math.max(1,nextWidth);height=Math.max(1,nextHeight);canvas.width=width;canvas.height=height;if(!lost)gl.viewport(0,0,width,height)},present(source){if(destroyed||lost||gl.isContextLost())return false;frame++;gl.useProgram(program);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);draw(source);trimTextureCache();return gl.getError()===gl.NO_ERROR},compose(sources,background=[0,0,0,0]){if(destroyed||lost||gl.isContextLost())return false;frame++;gl.useProgram(program);gl.clearColor(...background);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);const active=new Set<TextureSource>();for(const source of sources){active.add(source);draw(source)}for(const source of textures.keys())if(!active.has(source))api.release(source);gl.disable(gl.BLEND);trimTextureCache();return gl.getError()===gl.NO_ERROR},readPixels(bytes){if(destroyed||lost||gl.isContextLost())throw new Error('Contexto WebGL indisponível');gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);if(gl.getError()!==gl.NO_ERROR)throw new Error('Falha na leitura do frame')},release(source){const entry=textures.get(source);if(entry){gl.deleteTexture(entry.texture);textures.delete(source)}},clearCache(){for(const entry of textures.values())gl.deleteTexture(entry.texture);textures.clear()},destroy(){if(destroyed)return;destroyed=true;canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);disposeResources();if(!gl.isContextLost())gl.finish();restoredListeners.clear()},onRestored(callback){restoredListeners.add(callback);return()=>restoredListeners.delete(callback)},get lost(){return lost||gl.isContextLost()},get textureCount(){return textures.size}};
  function onLost(event:Event):void {event.preventDefault();lost=true;textures.clear();buffer=null;program=null;position=-1}
  function onRestored():void {if(destroyed)return;lost=false;initialize();for(const callback of restoredListeners)callback()}
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);initialize();return api;
}

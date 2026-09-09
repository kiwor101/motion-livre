(function(root){
  function create({document,media,viewport,canvas=document.createElement('canvas')}){
    const gpu=MotionWebGL.create(canvas),context=gpu?null:canvas.getContext('2d');
    const rasterizer=MotionRasterizer.create({document,media,viewport}),scratch=document.createElement('canvas');
    let destroyed=false,alpha=false;
    function* layers(project,time,width,height){
      if(scratch.width!==width)scratch.width=width;if(scratch.height!==height)scratch.height=height;
      for(const layer of project.layers){
        if(['audio','null','camera'].includes(layer.type)||layer.visible===false||time<(layer.start||0)||time>=(layer.end??project.duration))continue;
        rasterizer.draw(scratch.getContext('2d'),scratch,time,project,true,[layer]);yield scratch;
      }
    }
    function render(project,time,width,height,transparent=false){
      if(destroyed)throw new Error('Compositor encerrado');alpha=transparent;
      if(canvas.width!==width||canvas.height!==height){if(gpu)gpu.resize(width,height);else{canvas.width=width;canvas.height=height}}
      if(!gpu){rasterizer.draw(context,canvas,time,project,transparent);return true;}
      const hex=project.composition?.background||'#08090b',background=transparent?[0,0,0,0]:[parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255,1];
      return gpu.compose(layers(project,time,width,height),background);
    }
    let row=new Uint8Array(0);
    function readFrame(bytes){
      if(gpu){gpu.readPixels(bytes);const stride=canvas.width*4;if(row.length!==stride)row=new Uint8Array(stride);for(let y=0;y<Math.floor(canvas.height/2);y++){const top=y*stride,bottom=(canvas.height-1-y)*stride;row.set(bytes.subarray(top,top+stride));bytes.copyWithin(top,bottom,bottom+stride);bytes.set(row,bottom)}}
      else bytes.set(context.getImageData(0,0,canvas.width,canvas.height).data);
      if(gpu&&alpha)for(let i=0;i<bytes.length;i+=4){const a=bytes[i+3];if(a&&a<255){bytes[i]=Math.min(255,Math.round(bytes[i]*255/a));bytes[i+1]=Math.min(255,Math.round(bytes[i+1]*255/a));bytes[i+2]=Math.min(255,Math.round(bytes[i+2]*255/a))}}
      return bytes;
    }
    function destroy(){if(destroyed)return;destroyed=true;gpu?.destroy();scratch.width=scratch.height=1;canvas.width=canvas.height=1;}
    return{render,readFrame,destroy,canvas,backend:gpu?'webgl2-compositor':'canvas2d-fallback',onRestored:callback=>gpu?.onRestored(callback),clearCache:()=>gpu?.clearCache(),get lost(){return gpu?.lost||false},get textureCount(){return gpu?.textureCount||0},get rasterBytes(){return scratch.width*scratch.height*4}};
  }
  root.MotionComposition={create};
})(globalThis);

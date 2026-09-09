(function(root){
  function create({document,bridge,viewport,onProgress=()=>{}}){
    let active=null;
    async function run(format,project,settings={}){
      if(active)throw new Error('Já existe uma exportação em andamento');
      const token={abort:new AbortController(),session:false};active=token;
      let compositor=null,media=null;
      try{
        const snapshot=structuredClone(project),bounds={...viewport()};
        media=MotionMediaRuntime.create({document,bridge,exporting:true});
        const requested=MotionExportSettings.normalize(format,settings,snapshot.composition,snapshot.duration);
        const audioTracks=MotionLayerCommands.exportAudioTracks(snapshot,requested.start,requested.end,MotionTime.audioSegmentForRange);
        const session=await bridge.beginFrameExport(format,snapshot.name||'projeto',audioTracks,requested);
        if(!session.started)return null;token.session=true;
        if(token.abort.signal.aborted){await bridge.cancelExport();return null;}
        const config=session.settings||requested;
        if(session.acceptsFrames){
          compositor=MotionComposition.create({document,media,viewport:()=>bounds});
          const frame=new Uint8Array(config.width*config.height*4);
          for(let index=0;index<config.frameCount;index++){
            token.abort.signal.throwIfAborted();
            const time=Math.min(config.start+index/config.fps,config.end-.000001);
            await media.prepare(snapshot.layers,time,token.abort.signal);
            if(!compositor.render(snapshot,time,config.width,config.height,config.transparent))throw new Error('Contexto WebGL indisponível durante exportação');
            await bridge.writeExportFrame(compositor.readFrame(frame));
            onProgress({frame:index+1,total:config.frameCount,textureCount:compositor.textureCount,rasterBytes:compositor.rasterBytes,mediaCount:media.size});
          }
        }
        token.abort.signal.throwIfAborted();
        return await bridge.finishFrameExport();
      }catch(error){
        if(token.session)await bridge.cancelExport().catch(()=>{});
        if(token.abort.signal.aborted)return null;
        throw error;
      }finally{
        try{compositor?.destroy()}finally{
          try{await media?.destroy()}finally{active=null}
        }
      }
    }
    async function cancel(){if(!active)return false;active.abort.abort();if(active.session)await bridge.cancelExport();return true;}
    return{run,cancel,get busy(){return !!active}};
  }
  root.MotionExportController={create};
})(globalThis);

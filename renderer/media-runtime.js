(function(root){
  function create({document,bridge,onChange=()=>{},exporting=false}){
    const records=new Map(),jobs=new Map(),proxies=new Map(),pending=new WeakSet();
    let audioContext=null,destroyed=false,destroyPromise=null;
    const original=layer=>layer.sourcePath&&bridge?.fileUrl?bridge.fileUrl(layer.sourcePath):(layer.content||layer.url||'');
    const url=layer=>!exporting&&(proxies.get(layer.sourcePath)||layer.proxyPath)&&bridge?.fileUrl?bridge.fileUrl(proxies.get(layer.sourcePath)||layer.proxyPath):original(layer);
    function release(record){
      for(const node of record.nodes||[])node.disconnect();
      for(const element of [record.visual,record.audio])if(element){element.pause?.();element.removeAttribute('src');element.load?.();element.remove();}
      for(const dispose of record.listeners)dispose();
    }
    function get(layer){
      if(!['image','drawing','video','audio'].includes(layer.type))return null;
      const src=url(layer),audioSrc=!exporting&&layer.type==='video'&&src!==original(layer)&&layer.hasAudio!==false?original(layer):'';
      let record=records.get(layer.id);
      if(record&&(record.src!==src||record.audioSrc!==audioSrc||record.type!==layer.type)){release(record);records.delete(layer.id);record=null;}
      if(!record){
        const visual=document.createElement(layer.type==='image'||layer.type==='drawing'?'img':layer.type);
        record={visual,audio:null,src,audioSrc,type:layer.type,listeners:[],nodes:null};
        if(visual.tagName!=='IMG'){visual.preload='auto';visual.playsInline=true;visual.muted=true;}
        visual.src=src;
        if(audioSrc){record.audio=document.createElement('audio');record.audio.preload='auto';record.audio.src=audioSrc;}
        for(const element of [visual,record.audio].filter(Boolean))for(const event of ['load','loadeddata','seeked','error']){
          const listener=()=>{if(!destroyed)onChange()};element.addEventListener(event,listener);record.listeners.push(()=>element.removeEventListener(event,listener));
        }
        records.set(layer.id,record);
      }
      return record.visual;
    }
    function attach(layer,container){const visual=get(layer),record=records.get(layer.id);if(!visual)return;container.append(visual);if(record.audio)container.append(record.audio);}
    function reconcile(layers){const ids=new Set(layers.map(l=>l.id));for(const [id,record] of records)if(!ids.has(id)){release(record);records.delete(id)}}
    async function proxy(layer,metadata){
      if(exporting||layer.type!=='video'||!layer.sourcePath||!bridge?.createProxy)return;
      const source=layer.sourcePath;if(proxies.has(source))return;
      if(jobs.has(source))return jobs.get(source);
      const job=bridge.createProxy(source,metadata).then(result=>{if(result?.proxied&&!destroyed){proxies.set(source,result.path);onChange()}}).finally(()=>jobs.delete(source));
      jobs.set(source,job);return job;
    }
    function graph(record,element){
      if(!audioContext||record.nodes)return;
      const source=audioContext.createMediaElementSource(element),input=audioContext.createGain(),split=audioContext.createChannelSplitter(2),merge=audioContext.createChannelMerger(2),left=audioContext.createGain(),right=audioContext.createGain();
      input.channelCount=2;input.channelCountMode='explicit';source.connect(input);input.connect(split);left.connect(merge,0,0);right.connect(merge,0,1);merge.connect(audioContext.destination);
      record.nodes=[source,input,split,left,right,merge];record.channel=null;
    }
    function sync(state){
      if(exporting)return;
      const solo=state.layers.some(l=>['audio','video'].includes(l.type)&&l.solo);
      for(const layer of state.layers){
        const record=records.get(layer.id);if(!record||record.type==='image'||record.type==='drawing')continue;
        const active=state.time>=(layer.start||0)&&state.time<(layer.end??state.duration),audible=record.audio||record.visual;
        graph(record,audible);
        const local=state.time-(layer.start||0),remaining=(layer.end??state.duration)-state.time;
        const fade=Math.max(0,Math.min(1,layer.fadeIn?local/layer.fadeIn:1,layer.fadeOut?remaining/layer.fadeOut:1));
        const gain=active&&!state.previewMuted&&!layer.muted&&(!solo||layer.solo)?Math.max(0,Math.min(2,(layer.volume??100)/100))*fade:0;
        if(record.nodes){
          const [, ,split,left,right]=record.nodes,channel=layer.audioChannel||'stereo';
          if(record.channel!==channel){split.disconnect();split.connect(left,channel==='right'?1:0);split.connect(right,channel==='left'?0:1);record.channel=channel;}
          const pan=Math.max(-1,Math.min(1,(layer.pan||0)/100));left.gain.value=gain*(pan>0?1-pan:1);right.gain.value=gain*(pan<0?1+pan:1);
        }
        for(const element of [record.visual,record.audio].filter(Boolean)){
          element.muted=element!==audible||gain===0; element.volume=record.nodes?1:Math.min(1,gain);element.playbackRate=Math.max(.0625,Math.min(16,layer.speed||1));
          if(element.readyState>=1){const target=Math.min(Math.max(0,element.duration-.001),MotionTime.sourceTimeForLayer(layer,state.time,element.duration));if(!element.seeking&&Math.abs(element.currentTime-target)>(state.playing&&!layer.reverse ? .15 : .001))element.currentTime=target;}
          if(!state.playing||!active||layer.reverse)element.pause();else if(element.paused&&!pending.has(element)){pending.add(element);element.play().catch(()=>{}).finally(()=>pending.delete(element))}
        }
      }
    }
    function pause(){for(const record of records.values()){record.visual.pause?.();record.audio?.pause()}}
    function start(){if(destroyed)return;audioContext??=root.AudioContext?new root.AudioContext():null;audioContext?.resume().catch(()=>{})}
    async function wait(element,event,signal){
      if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
      await new Promise((resolve,reject)=>{
        const cleanup=()=>{clearTimeout(timer);element.removeEventListener(event,done);element.removeEventListener('error',fail);signal?.removeEventListener('abort',abort)};
        const done=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(new Error('Mídia indisponível: '+element.src))},abort=()=>{cleanup();reject(new DOMException('Cancelado','AbortError'))};
        const timer=setTimeout(fail,15000);element.addEventListener(event,done,{once:true});element.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true});
      });
    }
    async function prepare(layers,time,signal){
      const active=layers.filter(l=>l.visible!==false&&time>=(l.start||0)&&time<(l.end??Infinity)&&['video','image','drawing'].includes(l.type));
      reconcile(active);
      await Promise.all(active.map(async layer=>{
        const element=get(layer);
        if(element.tagName==='IMG'){if(!element.complete)await wait(element,'load',signal);if(!element.naturalWidth)throw new Error('Imagem indisponível');return;}
        if(element.error)throw new Error('Vídeo indisponível');
        if(element.readyState<2)await wait(element,'loadeddata',signal);
        const target=Math.min(Math.max(0,element.duration-.001),MotionTime.sourceTimeForLayer(layer,time,element.duration));
        if(Math.abs(element.currentTime-target)>.00001){const ready=wait(element,'seeked',signal);element.currentTime=target;await ready;}
      }));
    }
    function destroy(){
      if(destroyPromise)return destroyPromise;
      destroyed=true;
      destroyPromise=(async()=>{for(const record of records.values())release(record);records.clear();proxies.clear();const context=audioContext;audioContext=null;if(context&&context.state!=='closed')await context.close()})();
      return destroyPromise;
    }
    return{get,attach,reconcile,proxy,url,original,sync,start,pause,prepare,destroy,get size(){return records.size}};
  }
  root.MotionMediaRuntime={create};
})(globalThis);

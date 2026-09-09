(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MotionExportSettings=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const number=(value,fallback,min,max)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
  function normalize(format,settings={},composition={},duration=10){
    if(!['mp4','mov','webm','gif','png','mp3'].includes(format))throw new Error('Formato de exportação inválido');
    const even=value=>Math.round(value/2)*2;
    const width=even(number(settings.width,composition.width||1920,64,7680));
    const height=even(number(settings.height,composition.height||1080,64,4320));
    const fps=number(settings.fps,composition.fps||30,1,120);
    const start=number(settings.start,0,0,duration),end=number(settings.end,duration,0,duration);
    if(end<=start)throw new Error('Intervalo de exportação vazio');
    return{width,height,fps,start,end,duration:end-start,frameCount:format==='png'?1:Math.max(1,Math.ceil((end-start)*fps)),quality:number(settings.quality,18,14,32),audioBitrate:/^(128|192|320)k$/.test(settings.audioBitrate)?settings.audioBitrate:'192k',transparent:!!settings.transparent};
  }
  return{normalize};
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MotionPreviewQuality=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function create({targetMs=16.7,maxPixels=2073600,minScale=.35}={}){
    let scale=1,average=targetMs,lastChange=0;
    function record(duration,now=Date.now()){average=average*.9+Math.max(0,duration)*.1;if(now-lastChange<750)return scale;if(average>targetMs*1.45&&scale>minScale){scale=Math.max(minScale,scale*.8);lastChange=now}else if(average<targetMs*.72&&scale<1){scale=Math.min(1,scale*1.1);lastChange=now}return scale}
    function dimensions(width,height,pixelRatio=1){let factor=Math.min(2,Math.max(.5,pixelRatio))*scale,w=Math.max(1,Math.round(width*factor)),h=Math.max(1,Math.round(height*factor));const pixels=w*h;if(pixels>maxPixels){const fit=Math.sqrt(maxPixels/pixels);w=Math.max(1,Math.round(w*fit));h=Math.max(1,Math.round(h*fit))}return{width:w,height:h,scale,averageMs:average}}
    function reset(){scale=1;average=targetMs;lastChange=0}
    return{record,dimensions,reset,get scale(){return scale},get averageMs(){return average}};
  }
  return{create};
});

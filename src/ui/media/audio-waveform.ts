export async function waveformFromFile(file:File):Promise<number[]> {
  if(file.size>250*1024*1024)return[];
  const audioContext=new AudioContext();
  try{
    const buffer=await audioContext.decodeAudioData(await file.arrayBuffer()),count=Math.max(512,Math.min(8192,Math.ceil(buffer.duration*100))),step=Math.max(1,Math.floor(buffer.length/count)),points:number[]=[];
    for(let index=0;index<count;index++){
      let peak=0;
      for(let channel=0;channel<buffer.numberOfChannels;channel++){
        const data=buffer.getChannelData(channel);
        for(let offset=0;offset<step;offset++)peak=Math.max(peak,Math.abs(data[index*step+offset]||0));
      }
      points.push(Math.round(peak*1000)/1000);
    }
    return points;
  }catch{return[]}
  finally{await audioContext.close().catch(()=>undefined)}
}

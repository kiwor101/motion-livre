export async function waveformFromFile(file:File):Promise<number[]> {
  if(file.size>250*1024*1024)return[];
  const audioContext=new AudioContext();
  try{
    const buffer=await audioContext.decodeAudioData(await file.arrayBuffer()),count=Math.max(512,Math.min(8192,Math.ceil(buffer.duration*50))),step=Math.max(1,Math.ceil(buffer.length/count)),points:number[]=[];
    for(let index=0;index<count;index++){
      let energy=0,peak=0,samples=0;
      for(let channel=0;channel<buffer.numberOfChannels;channel++){
        const data=buffer.getChannelData(channel);
        const first=index*step,last=Math.min(data.length,first+step);
        for(let sample=first;sample<last;sample++){const value=data[sample]||0;energy+=value*value;peak=Math.max(peak,Math.abs(value));samples++}
      }
      // RMS carries the musical dynamics that peak-only sampling erases on mastered tracks.
      const rms=samples?Math.sqrt(energy/samples):0,value=rms*.88+peak*.12;
      points.push(Math.round(value*100000)/100000);
    }
    return points;
  }catch{return[]}
  finally{await audioContext.close().catch(()=>undefined)}
}

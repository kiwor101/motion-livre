const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');

ipcMain.handle('app:info',()=>({version:app.getVersion()}));ipcMain.handle('project:recover',()=>null);ipcMain.handle('project:autosave',()=>null);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    const externalXml=process.env.ALIGHT_XML_FIXTURE?await fs.readFile(process.env.ALIGHT_XML_FIXTURE,'utf8'):null;
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const check=(value,message)=>{if(!value)throw Error(message)},externalXml=${JSON.stringify(externalXml)},xml=\`<?xml version="1.0" encoding="UTF-8"?>
      <scene title="Preset" width="1080" height="1080" totalTime="2015" fps="60" bgcolor="#ff000000" amver="1002351" retime="freeze">
        <shape id="10114464" label="Imagem perdida A" startTime="0" endTime="1015" fillType="media" fillImage="content://missing/a" s=".rect">
          <effect id="com.alightcreative.effects.randomdisplace" locallyApplied="false" custom="keep"><property name="mag" type="float"><kf t="-0.021459" v="90.000000"/><kf t="1.010811" v="0.000000" e="cubicBezier 0.0 0.0 1.0 1.0"/></property></effect>
          <effect id="com.alightcreative.effects.randomdisplace" locallyApplied="false"><property name="seed" type="float" value="0.080000"/></effect>
        </shape>
        <shape id="10114465" label="Imagem perdida B" startTime="1000" endTime="2015" fillType="media" fillImage="content://missing/b" s=".rect">
          <effect id="com.alightcreative.effects.flicker2" hidden="true" locallyApplied="true"><property name="freq" type="float" value="6.650000"/></effect>
        </shape>
      </scene>\`;
      addLayer('rect','','Antes da importação');await Promise.resolve();pushHistory();const before=JSON.stringify(projectData());
      try{alightCompat.importScene('<scene><shape></scene>',{silent:true})}catch{}check(JSON.stringify(projectData())===before,'Malformed XML mutated project');
      const report=alightCompat.importScene(xml,{silent:true}),first=state.layers[0],second=state.layers[1];
      check(report.layers===2&&state.duration===2.015,'Scene dimensions were not imported');
      check(first.alightEffects.length===2&&first.alightEffects.every(effect=>effect.id==='randomdisplace'),'Effect prefix or duplicates were lost');
      check(first.alightEffects[0].sourceId==='com.alightcreative.effects.randomdisplace'&&first.alightEffects[0].attributes.custom==='keep','Original effect metadata was lost');
      check(first.alightEffects[0].properties[0].keyframes[0].time===-0.021459&&first.alightEffects[0].properties[0].keyframes[1].time===1.010811,'Out-of-range effect keyframes were clamped');
      check(second.alightEffects[0].hidden===true&&state.alightScene.attributes.retime==='freeze','Flags or scene attributes were lost');await Promise.resolve();
      document.querySelector('#undoBtn').click();await Promise.resolve();check(state.layers.length===1&&state.layers[0].name==='Antes da importação','Alight import did not undo in one step');document.querySelector('#redoBtn').click();await Promise.resolve();check(state.layers.length===2&&state.layers[0]?.alightEffects?.length===2,'Alight import redo failed: '+JSON.stringify(state.layers.map(layer=>({name:layer.name,effects:layer.alightEffects?.length}))));
      const saved=projectData();loadProjectData(saved);check(state.layers[0].alightEffects[0].properties[0].keyframes[0].time===-0.021459&&state.alightScene.attributes.amver==='1002351','Native save/reopen lost Alight metadata');
      const output=alightCompat.exportScene(),doc=new DOMParser().parseFromString(output,'application/xml'),effects=[...doc.querySelectorAll('shape')][0].querySelectorAll(':scope > effect');
      check(effects.length===2&&effects[0].getAttribute('id')==='com.alightcreative.effects.randomdisplace'&&effects[1].getAttribute('id')===effects[0].getAttribute('id'),'Effect round-trip changed order or duplicates');
      check(effects[0].querySelector('kf').getAttribute('t')==='-0.021459'&&doc.documentElement.getAttribute('retime')==='freeze','Round-trip changed keyframe or scene metadata');
      check([...doc.querySelectorAll('shape')].map(node=>node.id).join(',')==='10114464,10114465','Original layer IDs were lost');
      if(externalXml){const fullReport=alightCompat.importScene(externalXml,{silent:true}),allEffects=state.layers.flatMap(layer=>layer.alightEffects||[]),fullOutput=alightCompat.exportScene(),fullDoc=new DOMParser().parseFromString(fullOutput,'application/xml'),outputIds=[...fullDoc.querySelectorAll('effect')].map(effect=>effect.getAttribute('id'));check(fullReport.layers===2&&allEffects.length>20,'Real preset effects were not imported');check(allEffects.every(effect=>!effect.id.startsWith('com.alightcreative')&&effect.sourceId.startsWith('com.alightcreative')),'Real preset IDs were not normalized reversibly');check(allEffects.filter(effect=>effect.id==='randomdisplace').length===6&&allEffects.some(effect=>effect.hidden),'Real preset duplicates or flags were lost');check(allEffects.flatMap(effect=>effect.properties).flatMap(property=>property.keyframes).some(key=>key.time<0)&&allEffects.flatMap(effect=>effect.properties).flatMap(property=>property.keyframes).some(key=>key.time>1),'Real preset keyframe times were lost');check([...new Set(allEffects.map(effect=>effect.sourceId))].every(id=>outputIds.filter(output=>output===id).length>=allEffects.filter(effect=>effect.sourceId===id).length),'Real preset round-trip lost original effects')}
      motionPreview.destroy();await motionMedia.destroy();
    })()`);
    console.log('PASS: Alight import is atomic and preserves effect identity, duplicates, flags, keyframes and XML round-trip');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});

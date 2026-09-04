const {contextBridge,ipcRenderer,webUtils}=require('electron');
const {pathToFileURL}=require('node:url');
contextBridge.exposeInMainWorld('motionDesktop',{
  saveProject:(data,suggestedName)=>ipcRenderer.invoke('project:save',{data,suggestedName}),
  openProject:()=>ipcRenderer.invoke('project:open'),
  saveEffect:(data,suggestedName)=>ipcRenderer.invoke('effect:save',{data,suggestedName}),
  openEffect:()=>ipcRenderer.invoke('effect:open'),
  saveAlight:(data,suggestedName)=>ipcRenderer.invoke('alight:save',{data,suggestedName}),
  openAlight:()=>ipcRenderer.invoke('alight:open'),
  autosave:data=>ipcRenderer.invoke('project:autosave',data),
  recover:()=>ipcRenderer.invoke('project:recover'),
  getPathForFile:file=>webUtils.getPathForFile(file),
  fileUrl:path=>pathToFileURL(path).href,
  probeMedia:path=>ipcRenderer.invoke('media:probe',path),
  exportMedia:(bytes,format,name,audioTracks,settings)=>ipcRenderer.invoke('export:media',{bytes,format,name,audioTracks,settings}),
  cancelExport:()=>ipcRenderer.invoke('export:cancel'),
  onExportProgress:callback=>ipcRenderer.on('export:progress',(_event,value)=>callback(value)),
  info:()=>ipcRenderer.invoke('app:info'),
  onMenu:(name,callback)=>ipcRenderer.on(`menu:${name}`,callback)
});

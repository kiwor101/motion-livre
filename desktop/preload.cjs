const {contextBridge,ipcRenderer,webUtils}=require('electron');
contextBridge.exposeInMainWorld('motionDesktop',{
  saveProject:(data,suggestedName)=>ipcRenderer.invoke('project:save',{data,suggestedName}),
  openProject:()=>ipcRenderer.invoke('project:open'),
  autosave:data=>ipcRenderer.invoke('project:autosave',data),
  recover:()=>ipcRenderer.invoke('project:recover'),
  getPathForFile:file=>webUtils.getPathForFile(file),
  exportMedia:(bytes,format,name,audioTracks)=>ipcRenderer.invoke('export:media',{bytes,format,name,audioTracks}),
  cancelExport:()=>ipcRenderer.invoke('export:cancel'),
  onExportProgress:callback=>ipcRenderer.on('export:progress',(_event,value)=>callback(value)),
  info:()=>ipcRenderer.invoke('app:info'),
  onMenu:(name,callback)=>ipcRenderer.on(`menu:${name}`,callback)
});

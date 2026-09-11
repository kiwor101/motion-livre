function configureVideoDecode(app,environment=process.env){
  if(environment.MOTION_LIVRE_HARDWARE_VIDEO_DECODE!=='1'){
    app.commandLine.appendSwitch('disable-accelerated-video-decode');
    return 'software';
  }
  return 'hardware';
}

module.exports={configureVideoDecode};

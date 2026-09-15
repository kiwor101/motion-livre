export interface UiState {
  drawing:boolean;
  timelineZoom:number;
  snapTimeline:boolean;
  showMotionPath:boolean;
  maskEditing:boolean;
  pathEditing:boolean;
  selectionAnchor:number|null;
}

export const uiState:UiState={drawing:false,timelineZoom:1,snapTimeline:true,showMotionPath:true,maskEditing:false,pathEditing:false,selectionAnchor:null};

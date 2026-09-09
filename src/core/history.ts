export interface HistoryOptions {limit?: number}
export interface HistoryState {past: string[];future: string[];limit: number}
export interface History {
  push(snapshot: string): boolean;
  begin(snapshot: string): void;
  commit(snapshot: string): boolean;
  cancel(): string|null;
  undo(): string|null;
  redo(): string|null;
  reset(snapshot?: string): void;
  canUndo(): boolean;
  canRedo(): boolean;
  inspect(): HistoryState;
}
function assertSnapshot(snapshot: unknown): asserts snapshot is string {
  if(typeof snapshot!=='string')throw new TypeError('O histórico aceita snapshots serializados');
}
export function createHistory({limit=40}: HistoryOptions={}): History {
  if(!Number.isSafeInteger(limit)||limit<1)throw new RangeError('Limite de histórico inválido');
  let past: string[]=[],future: string[]=[],transaction: string|null=null;
  const api: History={
    push(snapshot){
      assertSnapshot(snapshot);if(transaction!==null||past.at(-1)===snapshot)return false;
      past.push(snapshot);if(past.length>limit)past.shift();future=[];return true;
    },
    begin(snapshot){if(transaction!==null)throw new Error('Já existe uma edição em andamento');api.push(snapshot);transaction=snapshot},
    commit(snapshot){if(transaction===null)return false;assertSnapshot(snapshot);transaction=null;return api.push(snapshot)},
    cancel(){const snapshot=transaction;transaction=null;return snapshot},
    undo(){if(!api.canUndo())return null;future.push(past.pop()!);return past.at(-1)!},
    redo(){if(!api.canRedo())return null;const snapshot=future.pop()!;past.push(snapshot);return snapshot},
    reset(snapshot){if(snapshot!==undefined)assertSnapshot(snapshot);past=snapshot===undefined?[]:[snapshot];future=[];transaction=null},
    canUndo(){return transaction===null&&past.length>1},
    canRedo(){return transaction===null&&future.length>0},
    inspect(){return {past:[...past],future:[...future],limit}}
  };
  return api;
}

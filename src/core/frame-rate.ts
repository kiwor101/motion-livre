const COMMON_FRAME_RATES=[23.976,24,25,29.97,30,50,59.94,60] as const;

export function parseFrameRate(value:unknown):number {
  if(typeof value==='number')return Number.isFinite(value)&&value>0?value:0;
  const parts=String(value||'').split('/').map(Number),numerator=parts[0],denominator=parts[1]??1,rate=numerator/denominator;
  return Number.isFinite(rate)&&rate>0?rate:0;
}

export function canonicalFrameRate(value:unknown):number {
  const rate=parseFrameRate(value);if(!rate)return 0;
  const nearest=COMMON_FRAME_RATES.reduce((best,candidate)=>Math.abs(candidate-rate)<Math.abs(best-rate)?candidate:best);
  return Math.abs(nearest-rate)/nearest<=.02?nearest:rate;
}

export function projectFrameRate(value:unknown):number {
  return Math.max(30,canonicalFrameRate(value)||30);
}

export function preferredFrameRate(nominal:unknown,average:unknown):number {
  return canonicalFrameRate(parseFrameRate(nominal)||parseFrameRate(average));
}

// KINE 301 Visuomotor Learning Experiment
// 2 practice trials + 20 recorded trials.

const BLOCKS = [
  { name: 'Practice', trials: 2, delay: 0, moving: false, record: false },
  { name: 'Baseline', trials: 5, delay: 0, moving: false, record: true },
  { name: 'Delay', trials: 5, delay: 200, moving: false, record: true },
  { name: 'Delay + Sway', trials: 5, delay: 200, moving: true, record: true },
  { name: 'Restored', trials: 5, delay: 0, moving: false, record: true }
];

const SWAY_AMPLITUDE = 110; // pixels
const SWAY_FREQUENCY = 0.45; // cycles/second
const MOVEMENT_THRESHOLD = 8; // pixels from start

const startScreen = document.querySelector('#start-screen');
const experimentScreen = document.querySelector('#experiment-screen');
const resultsScreen = document.querySelector('#results-screen');
const game = document.querySelector('#game-area');
const startCircle = document.querySelector('#start-circle');
const target = document.querySelector('#target');
const cursor = document.querySelector('#virtual-cursor');
const message = document.querySelector('#message');

let participantId = '';
let blockIndex = 0;
let trialInBlock = 0;
let globalTrial = 0;
let trialActive = false;
let trialReady = true;
let targetShownAt = 0;
let movementOnsetAt = null;
let rawMouse = { x: 0, y: 0 };
let shownMouse = { x: 0, y: 0 };
let mouseBuffer = [];
let pathLength = 0;
let previousShown = null;
let maxProjection = 0;
let targetBaseX = 0;
let targetY = 0;
let swayStart = 0;
let data = [];
let animationId = null;

const totalTrials = BLOCKS.reduce((n,b)=>n+b.trials,0);

function currentBlock(){ return BLOCKS[blockIndex]; }
function distance(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }

function updateLabels(){
  document.querySelector('#phase-label').textContent = currentBlock().name;
  document.querySelector('#trial-label').textContent = `Trial ${trialInBlock + 1} of ${currentBlock().trials}`;
  document.querySelector('#progress-label').textContent = `${globalTrial + 1} / ${totalTrials}`;
}

function startExperiment(){
  const id = document.querySelector('#participant-id').value.trim();
  if(!id){ alert('Enter a Participant ID first.'); return; }
  participantId = id;
  startScreen.classList.add('hidden');
  experimentScreen.classList.remove('hidden');
  resetForReady();
  animationId = requestAnimationFrame(render);
}

function resetForReady(){
  trialActive = false;
  trialReady = true;
  target.style.display = 'none';
  cursor.style.display = 'block';
  message.style.display = 'block';
  message.textContent = 'Move into the start circle and click to begin.';
  mouseBuffer = [];
  previousShown = null;
  updateLabels();
}

function getLocalPointer(e){
  const r = game.getBoundingClientRect();
  return { x: e.clientX-r.left, y: e.clientY-r.top };
}

function startCenter(){
  return { x: game.clientWidth/2, y: game.clientHeight*.86 };
}

function beginTrial(){
  const b = currentBlock();
  trialReady = false;
  trialActive = true;
  movementOnsetAt = null;
  pathLength = 0;
  maxProjection = 0;
  previousShown = null;
  const margin = 170;
  targetBaseX = margin + Math.random() * Math.max(1, game.clientWidth - margin*2);
  targetY = game.clientHeight*.18;
  swayStart = performance.now();
  targetShownAt = performance.now();
  target.style.display = 'block';
  message.style.display = 'none';
  const s = startCenter();
  rawMouse = {...s}; shownMouse = {...s};
  mouseBuffer = [{t:performance.now()-b.delay-5,x:s.x,y:s.y},{t:performance.now(),x:s.x,y:s.y}];
}

function targetPosition(now=performance.now()){
  const b = currentBlock();
  let x = targetBaseX;
  if(b.moving){
    const seconds=(now-swayStart)/1000;
    x += SWAY_AMPLITUDE*Math.sin(2*Math.PI*SWAY_FREQUENCY*seconds);
  }
  return {x,y:targetY};
}

function delayedPosition(now){
  const delay=currentBlock().delay;
  if(delay===0) return {...rawMouse};
  const wanted=now-delay;
  while(mouseBuffer.length>2 && mouseBuffer[1].t<wanted) mouseBuffer.shift();
  if(mouseBuffer.length===1) return {x:mouseBuffer[0].x,y:mouseBuffer[0].y};
  const a=mouseBuffer[0], b=mouseBuffer[1];
  if(wanted<=a.t) return {x:a.x,y:a.y};
  if(wanted>=b.t) return {x:b.x,y:b.y};
  const p=(wanted-a.t)/(b.t-a.t);
  return {x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p};
}

function render(now){
  if(!experimentScreen.classList.contains('hidden')){
    shownMouse=delayedPosition(now);
    cursor.style.left=`${shownMouse.x}px`;
    cursor.style.top=`${shownMouse.y}px`;
    if(trialActive){
      const tp=targetPosition(now);
      target.style.left=`${tp.x}px`; target.style.top=`${tp.y}px`;
      if(previousShown){ pathLength += distance(previousShown,shownMouse); }
      previousShown={...shownMouse};
      if(movementOnsetAt===null && distance(shownMouse,startCenter())>=MOVEMENT_THRESHOLD){ movementOnsetAt=now; }
      // Projection beyond the target along the start-to-target direction.
      const s=startCenter(); const vx=tp.x-s.x, vy=tp.y-s.y; const len=Math.hypot(vx,vy)||1;
      const projection=((shownMouse.x-s.x)*vx+(shownMouse.y-s.y)*vy)/len;
      maxProjection=Math.max(maxProjection,projection-len);
    }
  }
  animationId=requestAnimationFrame(render);
}

function finishTrial(now){
  const b=currentBlock();
  const tp=targetPosition(now);
  const error=distance(shownMouse,tp);
  const targetRadius=32;
  const onset=movementOnsetAt ?? targetShownAt;
  const row={
    participant_id:participantId,
    global_trial:globalTrial+1,
    phase:b.name,
    phase_trial:trialInBlock+1,
    recorded:b.record,
    delay_ms:b.delay,
    target_motion:b.moving?'sway':'stationary',
    sway_amplitude_px:b.moving?SWAY_AMPLITUDE:0,
    sway_frequency_hz:b.moving?SWAY_FREQUENCY:0,
    reaction_time_ms:Math.round(onset-targetShownAt),
    movement_time_ms:Math.round(now-onset),
    total_trial_time_ms:Math.round(now-targetShownAt),
    endpoint_error_px:Number(error.toFixed(2)),
    hit:error<=targetRadius,
    overshoot_px:Number(Math.max(0,maxProjection).toFixed(2)),
    path_length_px:Number(pathLength.toFixed(2)),
    viewport_width_px:game.clientWidth,
    viewport_height_px:game.clientHeight
  };
  data.push(row);
  trialActive=false;
  target.style.display='none';
  advanceTrial();
}

function advanceTrial(){
  globalTrial++;
  trialInBlock++;
  if(trialInBlock>=currentBlock().trials){ blockIndex++; trialInBlock=0; }
  if(blockIndex>=BLOCKS.length){ finishExperiment(); return; }
  setTimeout(resetForReady,350);
}

game.addEventListener('pointermove',e=>{
  rawMouse=getLocalPointer(e);
  mouseBuffer.push({t:performance.now(),x:rawMouse.x,y:rawMouse.y});
  if(mouseBuffer.length>500) mouseBuffer.shift();
});

game.addEventListener('pointerdown',e=>{
  const p=getLocalPointer(e);
  if(trialReady){
    if(distance(p,startCenter())<=34) beginTrial();
    return;
  }
  if(trialActive) finishTrial(performance.now());
});

function finishExperiment(){
  experimentScreen.classList.add('hidden');
  resultsScreen.classList.remove('hidden');
  const recorded=data.filter(d=>d.recorded);
  const hits=recorded.filter(d=>d.hit).length;
  const mean=(arr,key)=>arr.reduce((s,r)=>s+r[key],0)/Math.max(1,arr.length);
  document.querySelector('#metric-trials').textContent=recorded.length;
  document.querySelector('#metric-hit-rate').textContent=`${Math.round(hits/recorded.length*100)}%`;
  document.querySelector('#metric-time').textContent=`${Math.round(mean(recorded,'movement_time_ms'))} ms`;
  document.querySelector('#metric-error').textContent=`${mean(recorded,'endpoint_error_px').toFixed(1)} px`;
  document.querySelector('#summary-text').textContent=`Participant ${participantId} completed the experiment. Download the CSV before starting another participant.`;
}

function downloadCSV(){
  const headers=Object.keys(data[0]||{});
  const rows=[headers.join(','),...data.map(r=>headers.map(h=>JSON.stringify(r[h])).join(','))];
  const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`visuomotor_${participantId}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(a.href);
}

document.querySelector('#start-btn').addEventListener('click',startExperiment);
document.querySelector('#download-btn').addEventListener('click',downloadCSV);
document.querySelector('#restart-btn').addEventListener('click',()=>location.reload());

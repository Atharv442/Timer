/* ─────────────────────────────────────────────────────────────
   app.js — Mascot Countdown Timer
   Single active timer, strict lifecycle, no background leaks.
───────────────────────────────────────────────────────────── */
'use strict';

// ── State ──────────────────────────────────────────────────────
let activeInterval = null;   // interval runner
let remainingSec   = 0;      // remaining duration in seconds
let targetEndTime  = 0;      // absolute timestamp when timer should end
let paused         = false;

// ── Elements ────────────────────────────────────────────────────
const setupScreen   = document.getElementById('setup-screen');
const runningScreen = document.getElementById('running-screen');
const hoursInput    = document.getElementById('hours');
const minutesInput  = document.getElementById('minutes');
const secondsInput  = document.getElementById('seconds');
const startBtn      = document.getElementById('start-btn');
const stopBtn       = document.getElementById('stop-btn');
const backBtn       = document.getElementById('back-btn');
const timerDisplay  = document.getElementById('timer-display');

// ── Helpers ─────────────────────────────────────────────────────
function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function killTimer() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  paused = false;
}

function resetStopBtn() {
  stopBtn.textContent = 'Stop';
  stopBtn.classList.remove('paused');
}

// ── Core tick (Timestamp-based: immune to background tab throttling & drift) ──
function tick() {
  if (paused) return;
  
  const now = Date.now();
  const diff = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
  remainingSec = diff;

  timerDisplay.textContent = formatTime(remainingSec);

  if (remainingSec <= 0) {
    killTimer();
    timerDisplay.classList.add('finished');
    resetStopBtn();
  }
}

// ── Start ────────────────────────────────────────────────────────
function startTimer() {
  killTimer();                              // destroy any previous timer

  const h = Math.max(0, parseInt(hoursInput.value,   10) || 0);
  const m = Math.max(0, parseInt(minutesInput.value,  10) || 0);
  const s = Math.max(0, parseInt(secondsInput.value,  10) || 0);
  remainingSec = h * 3600 + m * 60 + s;
  targetEndTime = Date.now() + remainingSec * 1000;

  timerDisplay.textContent = formatTime(remainingSec);
  timerDisplay.classList.remove('finished');
  resetStopBtn();

  // Show running screen
  setupScreen.classList.remove('active');
  runningScreen.classList.add('active');

  if (remainingSec > 0) {
    activeInterval = setInterval(tick, 250); // fast 250ms check for instant visual updates
  } else {
    timerDisplay.classList.add('finished');
  }
}

// ── Stop / Resume ────────────────────────────────────────────────
function togglePause() {
  if (remainingSec <= 0) return;   // already finished — do nothing

  if (!paused) {
    paused = true;
    if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
    stopBtn.textContent = 'Resume';
    stopBtn.classList.add('paused');
  } else {
    paused = false;
    resetStopBtn();
    targetEndTime = Date.now() + remainingSec * 1000; // recalculate end timestamp
    activeInterval = setInterval(tick, 250);
  }
}

// ── Back ─────────────────────────────────────────────────────────
function goBack() {
  killTimer();                              // guaranteed clean stop
  timerDisplay.classList.remove('finished');
  resetStopBtn();
  runningScreen.classList.remove('active');
  setupScreen.classList.add('active');
}

// ── Input sanitation ─────────────────────────────────────────────
[hoursInput, minutesInput, secondsInput].forEach(inp => {
  inp.addEventListener('focus', () => inp.select());
  inp.addEventListener('input', () => {
    let v = parseInt(inp.value, 10);
    if (isNaN(v) || v < 0) v = 0;
    if (inp.id !== 'hours' && v > 59) v = 59;
    if (inp.id === 'hours' && v > 99) v = 99;
    inp.value = v;
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') startTimer(); });
});

// ── Listeners ────────────────────────────────────────────────────
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click',  togglePause);
backBtn.addEventListener('click',  goBack);

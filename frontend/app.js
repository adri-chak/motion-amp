/* ═══════════════════════════════════════════════════════════════
   MOTION AMP — app.js
   Page routing · Animations · Canvas ROI · Vibration Chart
═══════════════════════════════════════════════════════════════ */

/* ── PAGE ROUTING ── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (name === 'landing') initLandingAnimations();
  if (name === 'upload') initROICanvas();
  if (name === 'results') initResultsPage();
}

/* ══════════════════════════════════════════════════
   PAGE 1: LANDING ANIMATIONS
══════════════════════════════════════════════════ */
function initLandingAnimations() {
  animateProgressBar();
  animateWaveCanvas();
}

function animateProgressBar() {
  const fill = document.getElementById('progressFill');
  if (!fill) return;
  let pct = 0, dir = 1;
  clearInterval(window._progressTimer);
  window._progressTimer = setInterval(() => {
    pct += dir * 0.6;
    if (pct >= 100) { pct = 100; dir = -1; }
    if (pct <= 0)   { pct = 0; dir = 1; }
    fill.style.width = pct + '%';
  }, 50);
}

function animateWaveCanvas() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let t = 0;
  cancelAnimationFrame(window._waveRaf);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#E8741A';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let x = 0; x < canvas.width; x++) {
      const phase = (x / canvas.width) * Math.PI * 6 + t;
      const y = canvas.height / 2 + Math.sin(phase) * 10 + Math.sin(phase * 2.3) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    t += 0.06;
    window._waveRaf = requestAnimationFrame(draw);
  }
  draw();
}

/* ══════════════════════════════════════════════════
   PAGE 2: UPLOAD
══════════════════════════════════════════════════ */

/* Drag & drop */
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('dropzone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragging'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragging'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) loadVideo(file);
  });
});

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadVideo(file);
}

function loadVideo(file) {
  const preview = document.getElementById('videoPreview');
  const info    = document.getElementById('fileInfo');
  const content = document.getElementById('dropzoneContent');
  const previewWrap = document.getElementById('dropzonePreview');
  const btn = document.getElementById('startBtn');
  const btnText = document.getElementById('startBtnText');

  const url = URL.createObjectURL(file);
  preview.src = url;
  content.style.display = 'none';
  previewWrap.style.display = 'block';
  info.textContent = `${file.name}  ·  ${(file.size / (1024*1024)).toFixed(1)} MB`;

  btn.classList.add('active');
  btn.style.cursor = 'pointer';
  btnText.textContent = 'Start Analysis';

  /* Once video metadata loads, update ROI canvas */
  preview.addEventListener('loadedmetadata', () => {
    initROICanvas();
  }, { once: true });
}

/* Preset selection */
function selectPreset(el, type) {
  document.querySelectorAll('.preset-item').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const cr = document.getElementById('customRangeInputs');
  cr.style.display = type === 'custom' ? 'block' : 'none';
}

/* ── ROI CANVAS ── */
function initROICanvas() {
  const canvas = document.getElementById('roiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const W = canvas.clientWidth || 590;
  const H = canvas.clientHeight || 280;
  canvas.width  = W;
  canvas.height = H;

  /* Initial ROI: 30% inset */
  let roi = { x: W * 0.28, y: H * 0.18, w: W * 0.44, h: H * 0.64 };
  let dragging = null;
  const HANDLE_R = 7;

  function handles() {
    return [
      { id: 'tl', x: roi.x,          y: roi.y          },
      { id: 'tr', x: roi.x + roi.w,  y: roi.y          },
      { id: 'bl', x: roi.x,          y: roi.y + roi.h  },
      { id: 'br', x: roi.x + roi.w,  y: roi.y + roi.h  },
    ];
  }

  function draw() {
    /* Grid background */
    ctx.fillStyle = '#1A2B3C';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    /* Dark overlay outside ROI */
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 0, W, roi.y);
    ctx.fillRect(0, roi.y, roi.x, roi.h);
    ctx.fillRect(roi.x + roi.w, roi.y, W - (roi.x + roi.w), roi.h);
    ctx.fillRect(0, roi.y + roi.h, W, H - (roi.y + roi.h));

    /* ROI border */
    ctx.strokeStyle = '#E8741A';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(roi.x, roi.y, roi.w, roi.h);

    /* ROI ACTIVE label */
    ctx.fillStyle = 'rgba(232,116,26,0.85)';
    ctx.fillRect(roi.x, roi.y - 18, 72, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '9px DM Mono, monospace';
    ctx.letterSpacing = '0.06em';
    ctx.fillText('ROI ACTIVE', roi.x + 6, roi.y - 6);

    /* Corner handles */
    handles().forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, HANDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = '#E8741A';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  function getHandle(mx, my) {
    return handles().find(h => Math.hypot(h.x - mx, h.y - my) < HANDLE_R + 4);
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  }

  canvas.addEventListener('mousedown', e => {
    const { x, y } = pos(e);
    const h = getHandle(x, y);
    if (h) dragging = h.id;
  });
  canvas.addEventListener('mousemove', e => {
    const { x, y } = pos(e);
    if (!dragging) {
      canvas.style.cursor = getHandle(x, y) ? 'pointer' : 'crosshair';
      return;
    }
    const minSz = 40;
    if (dragging === 'tl') {
      const nx = Math.min(x, roi.x + roi.w - minSz);
      const ny = Math.min(y, roi.y + roi.h - minSz);
      roi.w += roi.x - nx; roi.h += roi.y - ny;
      roi.x = nx; roi.y = ny;
    } else if (dragging === 'tr') {
      roi.w = Math.max(minSz, x - roi.x);
      const ny = Math.min(y, roi.y + roi.h - minSz);
      roi.h += roi.y - ny; roi.y = ny;
    } else if (dragging === 'bl') {
      const nx = Math.min(x, roi.x + roi.w - minSz);
      roi.w += roi.x - nx; roi.x = nx;
      roi.h = Math.max(minSz, y - roi.y);
    } else if (dragging === 'br') {
      roi.w = Math.max(minSz, x - roi.x);
      roi.h = Math.max(minSz, y - roi.y);
    }
    draw();
  });
  canvas.addEventListener('mouseup', () => dragging = null);
  canvas.addEventListener('mouseleave', () => dragging = null);

  draw();
}

/* ── ANALYSIS START / PROCESSING ── */
function startAnalysis() {
  const btn = document.getElementById('startBtn');
  if (!btn.classList.contains('active')) return;

  const overlay = document.getElementById('processingOverlay');
  overlay.style.display = 'flex';

  const steps = [
    'Decomposing spatial frequencies…',
    'Extracting local phase per sub-band…',
    'Applying Butterworth band-pass filter…',
    'Amplifying phase components (×8)…',
    'Reconstructing frames…',
    'Running FFT vibration analysis…',
    'Identifying dominant frequency…',
    'Generating report…',
  ];
  let stepIdx = 0;
  const stepEl = document.getElementById('processingStep');
  const barEl  = document.getElementById('processingBar');

  const totalMs = 3800;
  const interval = totalMs / steps.length;
  let elapsed = 0;

  const timer = setInterval(() => {
    elapsed += interval;
    const pct = Math.min((elapsed / totalMs) * 100, 100);
    barEl.style.width = pct + '%';
    if (stepIdx < steps.length) {
      stepEl.textContent = steps[stepIdx++];
    }
    if (elapsed >= totalMs) {
      clearInterval(timer);
      setTimeout(() => {
        overlay.style.display = 'none';
        showPage('results');
      }, 400);
    }
  }, interval);
}

/* ══════════════════════════════════════════════════
   PAGE 3: RESULTS
══════════════════════════════════════════════════ */
function initResultsPage() {
  animateFreqNumber();
  animateResultWave();
  drawVibrationChart();
}

/* Animated count-up for dominant frequency */
function animateFreqNumber() {
  const el = document.getElementById('freqNumber');
  if (!el) return;
  const target = 18.4;
  let current  = 0;
  const duration = 900;
  const start  = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    current = eased * target;
    el.textContent = current.toFixed(1);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Animated wave on amplified result video */
function animateResultWave() {
  const canvas = document.getElementById('resultWaveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let t = 0;
  cancelAnimationFrame(window._resultWaveRaf);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#E8741A';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(232,116,26,0.4)';
    ctx.shadowBlur = 4;
    for (let x = 0; x < canvas.width; x++) {
      const phase = (x / canvas.width) * Math.PI * 8 + t;
      const amp = 12 + Math.sin(t * 0.4) * 4;
      const y = canvas.height / 2 + Math.sin(phase) * amp * 0.7 + Math.sin(phase * 1.8) * amp * 0.3;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    t += 0.07;
    window._resultWaveRaf = requestAnimationFrame(draw);
  }
  draw();
}

/* Vibration intensity chart */
function drawVibrationChart() {
  const canvas = document.getElementById('vibrationChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const W = canvas.clientWidth;
  const H = 90;
  canvas.width  = W;
  canvas.height = H;

  const N = 120;
  const data = generateVibrationData(N);
  const baseline = generateBaselineData(N);

  const maxVal = Math.max(...data);

  function xOf(i) { return (i / (N - 1)) * W; }
  function yOf(v) { return H - 10 - (v / maxVal) * (H - 20); }

  /* Baseline fill */
  ctx.beginPath();
  baseline.forEach((v, i) => {
    i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v));
  });
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = 'rgba(46,125,82,0.07)';
  ctx.fill();

  /* Baseline line */
  ctx.beginPath();
  baseline.forEach((v, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)));
  ctx.strokeStyle = 'rgba(46,125,82,0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  /* Detection fill */
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(232,116,26,0.25)');
  grad.addColorStop(1, 'rgba(232,116,26,0.01)');
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  /* Detection line */
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)));
  ctx.strokeStyle = '#E8741A';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  /* Peak marker */
  const peakIdx = data.indexOf(maxVal);
  ctx.beginPath();
  ctx.arc(xOf(peakIdx), yOf(maxVal), 4, 0, Math.PI * 2);
  ctx.fillStyle = '#E8741A';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  /* X-axis time labels */
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '10px DM Mono, monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 6; i++) {
    const xi = Math.round((i / 6) * (N - 1));
    const sec = ((i / 6) * 12).toFixed(0);
    ctx.fillText(`${sec}s`, xOf(xi), H - 1);
  }

  /* Threshold line */
  const thresholdY = yOf(maxVal * 0.35);
  ctx.beginPath();
  ctx.moveTo(0, thresholdY); ctx.lineTo(W, thresholdY);
  ctx.strokeStyle = 'rgba(201,87,26,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(201,87,26,0.6)';
  ctx.font = '9px DM Mono, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Threshold', W - 4, thresholdY - 3);
}

/* Data generators */
function generateVibrationData(n) {
  const data = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const base = 20 + Math.sin(t * Math.PI * 12) * 28;
    const spike = (i > 38 && i < 82) ? Math.sin((t - 0.32) * Math.PI * 18) * 38 + 10 : 5;
    const noise = (Math.random() - 0.5) * 6;
    data.push(Math.max(0, base + spike + noise));
  }
  return data;
}

function generateBaselineData(n) {
  const data = [];
  for (let i = 0; i < n; i++) {
    data.push(8 + (Math.random() - 0.5) * 4);
  }
  return data;
}

/* ── EXPORT (stub) ── */
function exportReport() {
  const btn = event.currentTarget || document.activeElement;
  const orig = btn.textContent;
  btn.textContent = 'Generating…';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '✓ Exported';
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2000);
  }, 1400);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initLandingAnimations();

  /* Resize: redraw chart if on results page */
  window.addEventListener('resize', () => {
    const rp = document.getElementById('page-results');
    if (rp && rp.classList.contains('active')) drawVibrationChart();
    const up = document.getElementById('page-upload');
    if (up && up.classList.contains('active')) initROICanvas();
  });
});

const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const totalEl = document.querySelector("#total");
const gapEl = document.querySelector("#gap");
const comboEl = document.querySelector("#combo");
const roundEl = document.querySelector("#round");
const riskEl = document.querySelector("#risk");
const unlockStatusEl = document.querySelector("#unlockStatus");
const messageEl = document.querySelector("#message");
const resetButton = document.querySelector("#resetButton");
const readyCard = document.querySelector("#readyCard");
const readyTitle = document.querySelector("#readyTitle");
const readyCopy = document.querySelector("#readyCopy");
const startRunButton = document.querySelector("#startRunButton");
const playAgainButton = document.querySelector("#playAgainButton");
const soundButton = document.querySelector("#soundButton");
const creatureNameEl = document.querySelector("#creatureName");
const creatureNoteEl = document.querySelector("#creatureNote");
const creatureSpeedEl = document.querySelector("#creatureSpeed");
const creatureRewardEl = document.querySelector("#creatureReward");
const styleButtons = document.querySelectorAll(".style-option");
const stageInner = document.querySelector("#stageInner");
const touchTarget = document.querySelector("#touchTarget");
const playGuide = document.querySelector("#playGuide");
const spriteFace = document.querySelector("#spriteFace");
const face = document.querySelector("#face");
const mouth = document.querySelector("#mouth");
const feedback = document.querySelector("#feedback");
const results = document.querySelector("#results");
const resultTitle = document.querySelector("#resultTitle");
const resultBadge = document.querySelector("#resultBadge");
const resultSummary = document.querySelector("#resultSummary");
const resultTotal = document.querySelector("#resultTotal");
const resultGap = document.querySelector("#resultGap");
const resultBites = document.querySelector("#resultBites");
const resultCombo = document.querySelector("#resultCombo");
const resultUnlock = document.querySelector("#resultUnlock");
const resultProgressLabel = document.querySelector("#resultProgressLabel");
const resultUnlockMeter = document.querySelector("#resultUnlockMeter");
const unlockMeter = document.querySelector("#unlockMeter");

const MAX_ROUNDS = 5;
const SPRITE_FRAME_COUNT = 9;
const SPRITE_ATLAS_COLUMNS = 3;
const SPRITE_ATLAS_ROWS = 3;

const audioSources = {
  start: "assets/audio/start.wav",
  tell: "assets/audio/tell.wav",
  blink: "assets/audio/blink.wav",
  escape: "assets/audio/escape.wav",
  close: "assets/audio/close.wav",
  chomp: "assets/audio/chomp.wav",
};

const spriteAnimations = {
  idle: [0, 1, 0],
  blink: [0, 3, 3, 3, 0],
  jaw: [0, 5, 5, 0],
  windup: [2, 6, 6, 5, 0],
  chomp: [6, 8, 7, 7],
};

const avatars = {
  human: {
    label: "Human",
    sprite: true,
    atlas: "assets/human/human-3x3-clean.png?v=7",
    unlockAt: 0,
    multiplier: 1,
    floor: 2200,
    ceiling: 5200,
    tellCount: 3,
    realTellChance: 0.52,
    difficulty: "Starter",
    message: "Readable, but lies with little blinks.",
    target: { x: 50, y: 63, width: 54, height: 31 },
  },
  wolf: {
    label: "Wolf",
    sprite: true,
    atlas: "assets/wolf/wolf-3x3-clean.png?v=7",
    unlockAt: 1800,
    multiplier: 1.1,
    floor: 1750,
    ceiling: 4600,
    tellCount: 5,
    realTellChance: 0.38,
    difficulty: "Faker",
    message: "Lots of jaw fakes, fast bite.",
    target: { x: 50, y: 62, width: 58, height: 32 },
  },
  shark: {
    label: "Shark",
    sprite: true,
    atlas: "assets/shark/shark-3x3-clean.png?v=7",
    unlockAt: 3600,
    multiplier: 1.2,
    floor: 1350,
    ceiling: 3800,
    tellCount: 2,
    realTellChance: 0.25,
    difficulty: "Sudden",
    message: "Quiet, sudden, rude.",
    target: { x: 50, y: 62, width: 60, height: 34 },
  },
  vampire: {
    label: "Vampire",
    unlockAt: 5600,
    multiplier: 1.35,
    floor: 1600,
    ceiling: 4300,
    tellCount: 4,
    realTellChance: 0.66,
    difficulty: "Tricky",
    message: "Smooth tells, nasty late snaps.",
    target: { x: 50, y: 64, width: 58, height: 32 },
  },
  croc: {
    label: "Croc",
    unlockAt: 7600,
    multiplier: 1.5,
    floor: 1050,
    ceiling: 3500,
    tellCount: 3,
    realTellChance: 0.18,
    difficulty: "Brutal",
    message: "Almost no warning, huge reward.",
    target: { x: 50, y: 62, width: 64, height: 32 },
  },
  alien: {
    label: "Alien",
    unlockAt: 9600,
    multiplier: 1.75,
    floor: 900,
    ceiling: 3100,
    tellCount: 6,
    realTellChance: 0.5,
    difficulty: "Chaos",
    message: "Twitchy nonsense, huge points.",
    target: { x: 50, y: 64, width: 58, height: 32 },
  },
};

const state = {
  round: 1,
  total: 0,
  combo: 1,
  bestCombo: 1,
  bites: 0,
  bestGap: Infinity,
  bestRun: Number(localStorage.getItem("bite-me-best-run") || 0),
  holding: false,
  bitten: false,
  gameOver: false,
  runLocked: false,
  hasStartedRun: false,
  ready: true,
  startTime: 0,
  biteAt: 0,
  biteTimer: 0,
  tellTimers: [],
  frame: 0,
  spriteTimer: 0,
  idleSpriteTimer: 0,
  audioContext: null,
  audioElements: {},
  soundMuted: localStorage.getItem("bite-me-muted") === "true",
  avatar: localStorage.getItem("finger-bite-avatar") || "human",
};

if (!avatars[state.avatar] || !isUnlocked(state.avatar)) {
  state.avatar = "human";
}

bestEl.textContent = Math.round(state.bestRun);
totalEl.textContent = "0";
roundEl.textContent = roundText();
updateUnlocks();
updateUnlockStatus();
setAvatar(state.avatar);
showReadyCard();
updateSoundButton();
preloadSpriteAtlases();
preloadAudio();

function biteDelay() {
  const avatar = avatars[state.avatar];
  const floor = Math.max(620, avatar.floor - state.round * 45);
  const ceiling = Math.max(floor + 650, avatar.ceiling - state.round * 95);
  return Math.floor(floor + Math.random() * (ceiling - floor));
}

function startHold(event) {
  event.preventDefault();
  if (state.holding || state.gameOver || !state.ready) return;
  if (event.pointerId !== undefined && event.currentTarget?.setPointerCapture) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  const delay = biteDelay();
  state.holding = true;
  state.bitten = false;
  if (!state.runLocked) {
    state.runLocked = true;
    state.hasStartedRun = true;
    hideReadyCard();
    updateUnlocks();
  }
  state.ready = false;
  state.startTime = performance.now();
  state.biteAt = state.startTime + delay;

  hidePlayGuide();
  messageEl.textContent = "Lift your finger before the bite.";
  gapEl.textContent = "--";
  setRisk("calm");
  unlockAudio();
  playSound("start");
  startIdleSpriteLoop();
  face.classList.remove("bitten", "tell-breath", "tell-swallow", "tell-jaw", "tell-blink");
  mouth.classList.remove("chomp");

  scheduleTells(delay);
  state.biteTimer = window.setTimeout(bite, delay);
  tick();
}

function endHold(event) {
  event.preventDefault();
  if (event.pointerId !== undefined && event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  if (!state.holding || state.bitten) return;

  const now = performance.now();
  const gapMs = state.biteAt - now;
  const heldSeconds = (now - state.startTime) / 1000;
  const points = scoreRelease(gapMs, heldSeconds);
  finishRound({ escaped: true, points, gapMs });
}

function bite() {
  if (!state.holding) return;

  state.bitten = true;
  mouth.classList.add("chomp");
  face.classList.add("bitten");
  stopIdleSpriteLoop();
  playSpriteAnimation("chomp", 75);
  playSound("chomp");
  finishRound({ escaped: false, points: 0, gapMs: 0 });
}

function scoreRelease(gapMs, heldSeconds) {
  const avatar = avatars[state.avatar];
  const precision = Math.max(0, 1300 - gapMs);
  const dangerBonus = gapMs <= 90 ? 900 : gapMs <= 180 ? 650 : gapMs <= 350 ? 320 : 0;
  const patience = Math.min(520, heldSeconds * 95);
  const comboMultiplier = 1 + Math.min(1.8, (state.combo - 1) * 0.18);
  return Math.round((precision + dangerBonus + patience) * avatar.multiplier * comboMultiplier);
}

function finishRound({ escaped, points, gapMs }) {
  state.holding = false;
  window.clearTimeout(state.biteTimer);
  clearTells();
  window.cancelAnimationFrame(state.frame);
  stopIdleSpriteLoop();
  face.classList.remove("tell-breath", "tell-swallow", "tell-jaw", "tell-blink");

  if (escaped) {
    state.total += points;
    state.combo = points > 0 ? state.combo + 1 : 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.bestGap = Math.min(state.bestGap, Math.max(0, Math.round(gapMs)));
    scoreEl.textContent = String(points);
    bestEl.textContent = Math.round(state.bestRun);
    totalEl.textContent = String(state.total);
    gapEl.textContent = `${Math.max(0, Math.round(gapMs))}ms`;
    comboEl.textContent = `x${state.combo}`;
    messageEl.textContent = releaseMessage(gapMs, points);
    stopSpriteAnimation();
    setSpriteFrame("idle");
    showFeedback(feedbackLabel(gapMs), riskTier(gapMs));
    playSound(gapMs <= 350 ? "close" : "escape");
    pulseDevice(gapMs <= 180 ? [20, 30, 20] : 15);
    updateUnlocks();
  } else {
    state.combo = 1;
    state.bites += 1;
    scoreEl.textContent = "0";
    totalEl.textContent = String(state.total);
    gapEl.textContent = "0ms";
    comboEl.textContent = "x1";
    setRisk("chomped");
    messageEl.textContent = "Too late. Combo broken.";
    showFeedback("Chomp", "bitten");
    pulseDevice([80, 40, 80]);
  }

  window.setTimeout(() => {
    if (state.round >= MAX_ROUNDS) {
      endRun();
      return;
    }

    state.round += 1;
    roundEl.textContent = roundText();
    state.ready = true;
    showPlayGuide(`Round ${state.round}: hold the mouth`, "Lift before the bite");
    if (escaped) setRisk("calm");
    setSpriteFrame("idle");
    if (avatars[state.avatar].sprite) startIdleSpriteLoop();
  }, 900);
}

function releaseMessage(gapMs, points) {
  if (gapMs <= 90) return `Perfect nerve. ${points} points.`;
  if (gapMs <= 180) return `Ridiculous escape. ${points} points.`;
  if (gapMs <= 350) return `Close shave. ${points} points.`;
  if (gapMs <= 700) return `Good escape. ${points} points.`;
  return `Safe, but early. ${points} points.`;
}

function feedbackLabel(gapMs) {
  if (gapMs <= 90) return "Perfect";
  if (gapMs <= 180) return "Absurd";
  if (gapMs <= 350) return "Close";
  if (gapMs <= 700) return "Clean";
  return "Early";
}

function riskTier(gapMs) {
  if (gapMs <= 120) return "perfect";
  if (gapMs <= 280) return "danger";
  if (gapMs <= 650) return "close";
  return "calm";
}

function setRisk(tier) {
  const labels = {
    calm: "Risk: calm",
    close: "Risk: close",
    danger: "Risk: reckless",
    perfect: "Risk: absurd",
    chomped: "Risk: chomped",
  };
  riskEl.className = `risk ${tier}`;
  riskEl.textContent = labels[tier];
}

function showFeedback(text, tier) {
  feedback.textContent = text;
  feedback.className = `feedback ${tier}`;
  window.requestAnimationFrame(() => {
    feedback.classList.add("show");
  });
  window.setTimeout(() => {
    feedback.classList.add("hidden");
  }, 900);
}

function pulseDevice(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function unlockAudio() {
  if (state.soundMuted) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!state.audioContext) state.audioContext = new AudioContext();
  if (state.audioContext.state === "suspended") state.audioContext.resume();
}

function toggleSound() {
  state.soundMuted = !state.soundMuted;
  localStorage.setItem("bite-me-muted", String(state.soundMuted));
  updateSoundButton();
  if (!state.soundMuted) {
    unlockAudio();
    playSound("start");
  }
}

function updateSoundButton() {
  if (!soundButton) return;
  soundButton.textContent = state.soundMuted ? "Sound Off" : "Sound On";
  soundButton.setAttribute("aria-pressed", String(!state.soundMuted));
}

function preloadAudio() {
  Object.entries(audioSources).forEach(([type, source]) => {
    const audio = new Audio(source);
    audio.preload = "auto";
    audio.volume = type === "chomp" ? 0.42 : 0.28;
    state.audioElements[type] = audio;
  });
}

function playSound(type) {
  if (state.soundMuted) return;
  if (playAudioAsset(type)) return;
  unlockAudio();
  const context = state.audioContext;
  if (!context) return;

  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.001, now);
  output.gain.exponentialRampToValueAtTime(type === "chomp" ? 0.24 : 0.12, now + 0.012);
  output.gain.exponentialRampToValueAtTime(0.001, now + soundDuration(type));
  output.connect(context.destination);

  if (type === "chomp") {
    playTone(context, output, 124, 0.13, "sawtooth", now);
    playTone(context, output, 78, 0.18, "square", now + 0.025);
    playNoise(context, output, 0.11, now + 0.015, 0.16);
  } else if (type === "close") {
    playTone(context, output, 520, 0.08, "triangle", now);
    playTone(context, output, 760, 0.1, "triangle", now + 0.065);
  } else if (type === "escape") {
    playTone(context, output, 420, 0.09, "sine", now);
    playTone(context, output, 610, 0.09, "sine", now + 0.055);
  } else if (type === "blink") {
    playTone(context, output, 260, 0.045, "sine", now);
  } else if (type === "tell") {
    playTone(context, output, 185, 0.06, "triangle", now);
  } else {
    playTone(context, output, 300, 0.055, "triangle", now);
  }

  window.setTimeout(() => output.disconnect(), soundDuration(type) * 1000 + 80);
}

function playAudioAsset(type) {
  const audio = state.audioElements[type];
  if (!audio) return false;
  const instance = audio.cloneNode();
  instance.volume = audio.volume;
  instance.play().catch(() => {});
  return true;
}

function soundDuration(type) {
  if (type === "chomp") return 0.24;
  if (type === "close") return 0.18;
  if (type === "escape") return 0.16;
  return 0.1;
}

function playTone(context, output, frequency, duration, type, startAt) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * 0.78), startAt + duration);
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.85, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playNoise(context, output, duration, startAt, volume) {
  const sampleCount = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(output);
  source.start(startAt);
}

function scheduleTells(delay) {
  clearTells();
  const avatar = avatars[state.avatar];
  const tellNames = ["tell-breath", "tell-swallow", "tell-jaw", "tell-blink"];

  for (let i = 0; i < avatar.tellCount; i += 1) {
    const at = Math.floor(220 + Math.random() * Math.max(300, delay - 430));
    const name = tellNames[Math.floor(Math.random() * tellNames.length)];
    state.tellTimers.push(window.setTimeout(() => pulseTell(name), at));
  }

  if (Math.random() < avatar.realTellChance) {
    const lateTell = Math.max(240, delay - (170 + Math.random() * 460));
    state.tellTimers.push(window.setTimeout(() => pulseTell("tell-jaw"), lateTell));
  }
}

function pulseTell(name) {
  if (!state.holding) return;
  face.classList.add(name);
  stageInner.classList.add(name);
  stopIdleSpriteLoop();
  playSpriteAnimation(spriteAnimationForTell(name), 125, { resumeIdle: true });
  playSound(name === "tell-blink" ? "blink" : "tell");
  const duration = 330 + Math.random() * 160;
  window.setTimeout(() => {
    face.classList.remove(name);
    stageInner.classList.remove(name);
  }, duration);
}

function clearTells() {
  state.tellTimers.forEach((timer) => window.clearTimeout(timer));
  state.tellTimers = [];
  stageInner.classList.remove("tell-breath", "tell-swallow", "tell-jaw", "tell-blink");
}

function tick() {
  if (!state.holding) return;
  const now = performance.now();
  const held = (now - state.startTime) / 1000;
  const gapMs = Math.max(0, state.biteAt - now);
  scoreEl.textContent = String(scoreRelease(gapMs, held));
  setRisk(riskTier(gapMs));
  state.frame = window.requestAnimationFrame(tick);
}

function resetGame() {
  localStorage.removeItem("finger-bite-best");
  localStorage.removeItem("bite-me-best-run");
  startNewRun({ clearBest: true });
}

function startNewRun({ clearBest = false } = {}) {
  state.round = 1;
  state.total = 0;
  state.combo = 1;
  state.bestCombo = 1;
  state.bites = 0;
  state.bestGap = Infinity;
  state.holding = false;
  state.bitten = false;
  state.gameOver = false;
  state.runLocked = false;
  state.hasStartedRun = false;
  state.ready = true;
  window.clearTimeout(state.biteTimer);
  clearTells();
  window.cancelAnimationFrame(state.frame);
  stopSpriteAnimation();
  stopIdleSpriteLoop();

  if (clearBest) {
    state.bestRun = 0;
  }

  if (!isUnlocked(state.avatar)) {
    state.avatar = "human";
  }

  scoreEl.textContent = "0";
  bestEl.textContent = Math.round(state.bestRun);
  totalEl.textContent = "0";
  gapEl.textContent = "--";
  comboEl.textContent = "x1";
  roundEl.textContent = roundText();
  setRisk("calm");
  results.classList.add("hidden");
  feedback.className = "feedback hidden";
  messageEl.textContent = "Touch and hold the mouth. Lift your finger before the bite.";
  face.className = `face ${state.avatar}`;
  mouth.className = "mouth";
  setSpriteActive();
  setMouthTarget();
  setSpriteFrame("idle");
  updateUnlocks();
  updateUnlockStatus();
  hidePlayGuide();
  showReadyCard();
}

function endRun() {
  state.gameOver = true;
  state.runLocked = false;
  state.hasStartedRun = false;
  state.ready = false;
  hidePlayGuide();
  setRisk("calm");
  stopSpriteAnimation();
  stopIdleSpriteLoop();
  setSpriteFrame("idle");
  const previousBest = state.bestRun;
  state.bestRun = Math.max(state.bestRun, state.total);
  localStorage.setItem("bite-me-best-run", String(state.bestRun));
  bestEl.textContent = Math.round(state.bestRun);
  updateUnlocks();
  updateUnlockStatus();

  const grade = runGrade();
  const isNewBest = state.total > previousBest;
  resultTitle.textContent = grade;
  resultBadge.textContent = resultBadgeText(isNewBest);
  resultSummary.textContent = resultSummaryText(grade, isNewBest);
  resultTotal.textContent = String(state.total);
  resultGap.textContent = Number.isFinite(state.bestGap) ? `${state.bestGap}ms` : "--";
  resultBites.textContent = String(state.bites);
  resultCombo.textContent = `x${state.bestCombo}`;
  resultUnlock.textContent = unlockResultText(previousBest);
  updateResultProgress();
  results.classList.remove("hidden");
  messageEl.textContent = `${grade}. ${state.total} points over ${MAX_ROUNDS} rounds.`;
}

function runGrade() {
  if (state.total >= 9000 && state.bites === 0) return "Legendary";
  if (state.total >= 6500) return "Reckless";
  if (state.total >= 4300) return "Brave";
  if (state.total >= 2200) return "Twitchy";
  return "Cautious";
}

function resultBadgeText(isNewBest) {
  if (isNewBest) return "New Best";
  if (state.bites === 0) return "Clean Run";
  if (Number.isFinite(state.bestGap) && state.bestGap <= 180) return "Near Miss";
  return "Run Complete";
}

function resultSummaryText(grade, isNewBest) {
  if (isNewBest) return `New best run with ${avatars[state.avatar].label}.`;
  if (state.bites === 0) return `Clean ${avatars[state.avatar].label} run.`;
  if (grade === "Cautious") return "You lived, but the mouth noticed.";
  return `${avatars[state.avatar].label} run complete.`;
}

function setAvatar(avatar) {
  if (state.runLocked && avatar !== state.avatar) return;
  if (!avatars[avatar] || !isUnlocked(avatar)) return;
  state.avatar = avatar;
  localStorage.setItem("finger-bite-avatar", avatar);
  face.className = `face ${avatar}`;
  stopSpriteAnimation();
  stopIdleSpriteLoop();
  setSpriteActive();
  setMouthTarget();
  setSpriteFrame("idle");
  updateCreatureCard();
  styleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.avatar === avatar);
  });
  messageEl.textContent = state.hasStartedRun ? "Lift your finger before the bite." : `${avatars[avatar].label}: ${avatars[avatar].message}`;
  if (!state.hasStartedRun && !state.gameOver) showReadyCard();
}

function setSpriteActive() {
  const active = Boolean(avatars[state.avatar].sprite);
  stageInner.classList.toggle("sprite-active", active);
  spriteFace.classList.toggle("hidden", !active);
}

function setMouthTarget() {
  const target = avatars[state.avatar].target || { x: 50, y: 64, width: 52, height: 30 };
  stageInner.style.setProperty("--mouth-x", `${target.x}%`);
  stageInner.style.setProperty("--mouth-y", `${target.y}%`);
  stageInner.style.setProperty("--mouth-width", `${target.width}%`);
  stageInner.style.setProperty("--mouth-height", `${target.height}%`);
}

function preloadSpriteAtlases() {
  Object.values(avatars).forEach((avatar) => {
    if (!avatar.atlas) return;
    const image = new Image();
    image.src = avatar.atlas;
  });
}

function setSpriteFrame(frame) {
  if (!avatars[state.avatar].sprite) return;
  const avatar = avatars[state.avatar];
  const frameIndex = typeof frame === "number" ? Math.min(frame, SPRITE_FRAME_COUNT - 1) : 0;
  const column = frameIndex % SPRITE_ATLAS_COLUMNS;
  const row = Math.floor(frameIndex / SPRITE_ATLAS_COLUMNS);
  const x = (column / (SPRITE_ATLAS_COLUMNS - 1)) * 100;
  const y = (row / (SPRITE_ATLAS_ROWS - 1)) * 100;
  spriteFace.className = "sprite-face";
  spriteFace.style.backgroundImage = `url("${avatar.atlas}")`;
  spriteFace.style.backgroundPosition = `${x}% ${y}%`;
}

function playSpriteAnimation(name, frameMs = 95, { resumeIdle = false } = {}) {
  if (!avatars[state.avatar].sprite) return;
  stopSpriteAnimation();

  const frames = spriteAnimations[name] || spriteAnimations.idle;
  let index = 0;
  setSpriteFrame(frames[index]);

  function nextFrame() {
    index += 1;
    if (index >= frames.length) {
      state.spriteTimer = 0;
      if (resumeIdle && state.holding) startIdleSpriteLoop();
      return;
    }

    setSpriteFrame(frames[index]);
    state.spriteTimer = window.setTimeout(nextFrame, frameMs);
  }

  state.spriteTimer = window.setTimeout(nextFrame, frameMs);
}

function stopSpriteAnimation() {
  window.clearTimeout(state.spriteTimer);
  state.spriteTimer = 0;
}

function startIdleSpriteLoop() {
  if (!avatars[state.avatar].sprite || !state.holding) return;
  stopIdleSpriteLoop();
  stopSpriteAnimation();
  setSpriteFrame("idle");

  const loop = () => {
    if (!state.holding || !avatars[state.avatar].sprite) return;
    playSpriteAnimation("idle", 140);
    state.idleSpriteTimer = window.setTimeout(loop, 900 + Math.random() * 900);
  };

  state.idleSpriteTimer = window.setTimeout(loop, 650);
}

function stopIdleSpriteLoop() {
  window.clearTimeout(state.idleSpriteTimer);
  state.idleSpriteTimer = 0;
}

function spriteAnimationForTell(name) {
  if (name === "tell-blink") return "blink";
  if (name === "tell-jaw") return "jaw";
  if (name === "tell-swallow") return "windup";
  return "idle";
}

function isUnlocked(avatar) {
  return state.bestRun >= avatars[avatar].unlockAt;
}

function updateUnlocks() {
  styleButtons.forEach((button) => {
    const avatar = button.dataset.avatar;
    const unlocked = isUnlocked(avatar);
    const data = avatars[avatar];
    const remaining = Math.max(0, data.unlockAt - state.bestRun);
    const lockedForRun = state.runLocked && avatar !== state.avatar;
    button.disabled = !unlocked || lockedForRun;
    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("run-locked", lockedForRun);
    button.classList.toggle("active", avatar === state.avatar);
    button.innerHTML = creatureButtonMarkup(data, unlocked, remaining, avatar);
    button.title = buttonTitle(data, unlocked, lockedForRun);
  });
  updateCreatureCard();
}

function updateUnlockStatus() {
  const next = nextUnlock();
  if (!next) {
    unlockStatusEl.textContent = "All current creatures unlocked. Chase a cleaner five-round run.";
    updateUnlockMeter(1);
    return;
  }

  const needed = next.unlockAt - state.bestRun;
  unlockStatusEl.textContent = `Next unlock: ${next.label} at ${next.unlockAt} best run. ${needed} points to go.`;
  updateUnlockMeter(state.bestRun / next.unlockAt);
}

function updateCreatureCard() {
  const avatar = avatars[state.avatar];
  if (!avatar) return;
  creatureNameEl.textContent = avatar.label;
  creatureNoteEl.textContent = avatar.message;
  creatureSpeedEl.textContent = state.runLocked ? "Locked for this run" : `Style: ${avatar.difficulty}`;
  creatureRewardEl.textContent = `Reward: ${avatar.multiplier}x`;
}

function creatureButtonMarkup(avatar, unlocked, remaining, avatarKey) {
  const lockedForRun = state.runLocked && avatarKey !== state.avatar;
  const status = lockedForRun ? "Locked this run" : unlocked ? `${avatar.difficulty} · ${avatar.multiplier}x` : `${remaining} pts to unlock`;
  const lock = state.runLocked && avatarKey === state.avatar ? "In run" : unlocked ? "Ready" : `Best ${avatar.unlockAt}`;
  return `<span>${avatar.label}</span><small>${status}</small><em>${lock}</em>`;
}

function buttonTitle(avatar, unlocked, lockedForRun) {
  if (lockedForRun) return "Creature is locked until the next run.";
  if (!unlocked) return `Unlock at ${avatar.unlockAt} best run`;
  return avatar.message;
}

function updateUnlockMeter(progress) {
  if (!unlockMeter) return;
  const percent = Math.max(0, Math.min(100, progress * 100));
  unlockMeter.style.width = `${percent}%`;
}

function updateResultProgress() {
  if (!resultUnlockMeter || !resultProgressLabel) return;
  const next = nextUnlock();
  if (!next) {
    resultProgressLabel.textContent = "All current creatures unlocked";
    resultUnlockMeter.style.width = "100%";
    return;
  }

  resultProgressLabel.textContent = `${Math.max(0, next.unlockAt - state.bestRun)} points to ${next.label}`;
  resultUnlockMeter.style.width = `${Math.max(0, Math.min(100, (state.bestRun / next.unlockAt) * 100))}%`;
}

function showReadyCard() {
  if (!readyCard) return;
  const avatar = avatars[state.avatar];
  hidePlayGuide();
  readyCard.classList.remove("hidden");
  readyTitle.textContent = `${avatar.label} run`;
  readyCopy.textContent = `${avatar.message} Watch the eyes and jaw: some movements are clues and some are fakes.`;
  touchTarget.setAttribute("aria-label", `Start ${avatar.label} run`);
}

function hideReadyCard() {
  if (!readyCard) return;
  readyCard.classList.add("hidden");
  touchTarget.setAttribute("aria-label", "Touch and hold the mouth");
}

function showPlayGuide(title = "Press and hold the mouth", detail = "Lift your finger before it bites") {
  if (!playGuide) return;
  playGuide.querySelector("strong").textContent = title;
  playGuide.querySelector("span").textContent = detail;
  playGuide.classList.remove("hidden");
}

function hidePlayGuide() {
  if (!playGuide) return;
  playGuide.classList.add("hidden");
}

function nextUnlock() {
  return Object.values(avatars)
    .filter((avatar) => avatar.unlockAt > state.bestRun)
    .sort((a, b) => a.unlockAt - b.unlockAt)[0];
}

function unlockResultText(previousBest) {
  const newlyUnlocked = Object.values(avatars)
    .filter((avatar) => avatar.unlockAt > previousBest && avatar.unlockAt <= state.bestRun)
    .map((avatar) => avatar.label);

  if (newlyUnlocked.length) {
    return `Unlocked: ${newlyUnlocked.join(", ")}`;
  }

  const next = nextUnlock();
  if (!next) return "All current creatures unlocked.";
  return `Next unlock: ${next.label} at ${next.unlockAt} best run.`;
}

function roundText() {
  return `${state.round}/${MAX_ROUNDS}`;
}

resetButton.addEventListener("click", resetGame);
playAgainButton.addEventListener("click", () => startNewRun());
startRunButton.addEventListener("click", () => {
  hideReadyCard();
  showPlayGuide();
  messageEl.textContent = "Touch and hold the mouth. Lift before it bites.";
  touchTarget.focus({ preventScroll: true });
});
soundButton.addEventListener("click", toggleSound);
styleButtons.forEach((button) => {
  button.addEventListener("click", () => setAvatar(button.dataset.avatar));
});
touchTarget.addEventListener("pointerdown", startHold);
touchTarget.addEventListener("pointerup", endHold);
touchTarget.addEventListener("pointercancel", endHold);
touchTarget.addEventListener("pointerleave", (event) => {
  if (state.holding && event.pointerType === "mouse") endHold(event);
});
touchTarget.addEventListener("touchstart", startHold, { passive: false });
touchTarget.addEventListener("touchend", endHold, { passive: false });
touchTarget.addEventListener("touchcancel", endHold, { passive: false });
touchTarget.addEventListener("keydown", (event) => {
  if ((event.key === " " || event.key === "Enter") && !event.repeat) startHold(event);
});
touchTarget.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") endHold(event);
});

[stageInner, touchTarget, spriteFace, face].forEach((element) => {
  element.addEventListener("contextmenu", suppressTouchBrowserGesture);
  element.addEventListener("selectstart", suppressTouchBrowserGesture);
  element.addEventListener("dragstart", suppressTouchBrowserGesture);
});

function suppressTouchBrowserGesture(event) {
  event.preventDefault();
}

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

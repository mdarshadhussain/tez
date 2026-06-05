// Programmatic Web Audio API synthesizer for TEZCLUB.IN

let audioCtx = null;
let masterEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const toggleAudio = (enabled) => {
  masterEnabled = enabled;
};

// Play a short synth click
export const playClick = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error(e);
  }
};

// Play winning chime
export const playWinChime = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);

    // Double chime
    [523.25, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      osc.connect(gain);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
    });
  } catch (e) {
    console.error(e);
  }
};

// Play coin flip sweep
export const playCoinFlipSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.error(e);
  }
};

// Play crash rocket hum with frequency matching multiplier
let activeHumOsc = null;
let activeHumGain = null;

export const startRocketHum = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (activeHumOsc) return;

    activeHumOsc = ctx.createOscillator();
    activeHumGain = ctx.createGain();
    
    activeHumOsc.type = 'sawtooth';
    activeHumOsc.frequency.setValueAtTime(80, ctx.currentTime);
    
    activeHumGain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    activeHumOsc.connect(activeHumGain);
    activeHumGain.connect(ctx.destination);
    
    activeHumOsc.start();
  } catch (e) {
    console.error(e);
  }
};

export const updateRocketHum = (mult) => {
  if (!activeHumOsc || !masterEnabled) return;
  try {
    const ctx = getAudioContext();
    // increase pitch as rocket climbs
    const targetFreq = 80 + Math.min(mult * 15, 300);
    activeHumOsc.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 0.1);
  } catch (e) {
    console.error(e);
  }
};

export const stopRocketHum = () => {
  if (activeHumOsc) {
    try {
      activeHumOsc.stop();
      activeHumOsc.disconnect();
    } catch (e) {}
    activeHumOsc = null;
    activeHumGain = null;
  }
};

// Play crash explosion
export const playExplosion = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.error(e);
  }
};

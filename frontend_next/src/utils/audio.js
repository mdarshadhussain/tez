// Programmatic Web Audio API synthesizer for TEZCLUB.IN
let audioCtx = null;
let masterEnabled = true;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
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
    if (!ctx) return;
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
    if (!ctx) return;
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

export const playCoinFlipSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 1.4;
    const now = ctx.currentTime;
    
    // Metallic Ring (high pitched coin ping)
    const oscRing1 = ctx.createOscillator();
    const oscRing2 = ctx.createOscillator();
    const gainRing = ctx.createGain();
    
    oscRing1.type = 'sine';
    oscRing1.frequency.setValueAtTime(2450, now);
    
    oscRing2.type = 'sine';
    oscRing2.frequency.setValueAtTime(2950, now);
    
    gainRing.gain.setValueAtTime(0.07, now);
    gainRing.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    oscRing1.connect(gainRing);
    oscRing2.connect(gainRing);
    gainRing.connect(ctx.destination);
    
    // Spinning air whirr
    const oscSpin = ctx.createOscillator();
    const gainSpin = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    oscSpin.type = 'triangle';
    oscSpin.frequency.setValueAtTime(350, now);
    oscSpin.frequency.exponentialRampToValueAtTime(1100, now + duration - 0.2);
    
    lfo.frequency.setValueAtTime(16, now); // coin rotating speed
    lfoGain.gain.setValueAtTime(140, now);
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscSpin.frequency);
    
    gainSpin.gain.setValueAtTime(0.03, now);
    gainSpin.gain.linearRampToValueAtTime(0.015, now + 0.3);
    gainSpin.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    oscSpin.connect(gainSpin);
    gainSpin.connect(ctx.destination);
    
    oscRing1.start(now);
    oscRing2.start(now);
    oscSpin.start(now);
    lfo.start(now);
    
    oscRing1.stop(now + duration);
    oscRing2.stop(now + duration);
    oscSpin.stop(now + duration);
    lfo.stop(now + duration);
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
    if (!ctx || activeHumOsc) return;

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
    if (!ctx) return;
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
    if (!ctx) return;
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

// Play short high-pitch tick for drawing numbers
export const playTick = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    console.error(e);
  }
};

// Play ding chime when selection is hit by a drawn ball
export const playHitSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.error(e);
  }
};

// Play short descending buzzer sound for game round loss
export const playLossSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.error(e);
  }
};

// Play a crystal chime when revealing a diamond/gem
export const playDiamondSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // High-pitched crystal harmony
    const frequencies = [880, 1320, 1760];
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    gainNode.connect(ctx.destination);

    frequencies.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.03);
      osc.connect(gainNode);
      osc.start(now + idx * 0.03);
      osc.stop(now + 0.35);
    });
  } catch (e) {
    console.error(e);
  }
};

// Play a heavy explosion rumble for the bomb/mine
export const playBombSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.55);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(90, now);
    osc2.frequency.linearRampToValueAtTime(30, now + 0.4);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.error(e);
  }
};


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

    const now = ctx.currentTime;
    
    // 1. Noise Generator for debris/blast hiss
    const bufferSize = ctx.sampleRate * 0.8; // 0.8 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(10, now + 0.7);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    // 2. Heavy Sub Bass Boom
    const oscBoom = ctx.createOscillator();
    const gainBoom = ctx.createGain();
    
    oscBoom.type = 'sawtooth';
    oscBoom.frequency.setValueAtTime(160, now);
    oscBoom.frequency.exponentialRampToValueAtTime(10, now + 0.65);
    
    gainBoom.gain.setValueAtTime(0.25, now);
    gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    
    // Distort the boom slightly for crunchiness
    const dist = ctx.createWaveShaper();
    const makeDistortionCurve = (amount) => {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    };
    dist.curve = makeDistortionCurve(40);
    dist.oversample = '4x';
    
    oscBoom.connect(dist);
    dist.connect(gainBoom);
    gainBoom.connect(ctx.destination);
    
    noiseNode.start(now);
    oscBoom.start(now);
    
    noiseNode.stop(now + 0.8);
    oscBoom.stop(now + 0.8);
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

// Play a mechanical wheel tick (sharp, non-tonal wooden click)
export const playWheelTick = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.02);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
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

// Keno-specific Thrill Originals sound assets programmatically synthesized
export const playKenoPick = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
};

export const playKenoBet = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

export const playKenoTick = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.02);
    
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch (e) {}
};

export const playKenoMatch = () => {
  if (!masterEnabled) return;
  try {
    const snd = new Audio('https://cdn.originals.thrill-games.com/v1.1.0/assets/BLcJ-tkX.mp3');
    snd.volume = 0.55;
    snd.play();
  } catch (e) {}
};

export const playKenoWin = () => {
  if (!masterEnabled) return;
  try {
    const snd = new Audio('https://cdn.originals.thrill-games.com/v1.1.0/assets/DoyfwkGB.mp3');
    snd.volume = 0.6;
    snd.play();
  } catch (e) {}
};

// Play synthesized roulette spin sound (whirr + pocket bounce clicks)
export const playRouletteSpinSound = () => {
  if (!masterEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Whirring noise generator for 2.2 seconds (representing the ball spinning in the outer track)
    const oscWhirr = ctx.createOscillator();
    const gainWhirr = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    oscWhirr.type = 'triangle';
    oscWhirr.frequency.setValueAtTime(600, now);
    oscWhirr.frequency.exponentialRampToValueAtTime(150, now + 2.0); // pitch drops as it slows
    
    lfo.frequency.setValueAtTime(25, now); // rotation speed modulation
    lfoGain.gain.setValueAtTime(100, now);
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscWhirr.frequency);
    
    gainWhirr.gain.setValueAtTime(0.04, now);
    gainWhirr.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    
    oscWhirr.connect(gainWhirr);
    gainWhirr.connect(ctx.destination);
    
    lfo.start(now);
    oscWhirr.start(now);
    
    lfo.stop(now + 2.2);
    oscWhirr.stop(now + 2.2);
    
    // Pocket drop clicks (pocket settle bounces) starting around 2.2 seconds to 2.8 seconds
    const clickTimes = [2.2, 2.32, 2.45, 2.58, 2.72, 2.85];
    clickTimes.forEach((time, idx) => {
      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      
      oscClick.type = 'sine';
      const freq = 600 - idx * 60;
      oscClick.frequency.setValueAtTime(freq, now + time);
      oscClick.frequency.exponentialRampToValueAtTime(80, now + time + 0.04);
      
      gainClick.gain.setValueAtTime(0.06 - idx * 0.008, now + time);
      gainClick.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.04);
      
      oscClick.connect(gainClick);
      gainClick.connect(ctx.destination);
      
      oscClick.start(now + time);
      oscClick.stop(now + time + 0.045);
    });
  } catch (e) {
    console.error(e);
  }
};


// Lightweight procedural sound effects using the Web Audio API.
// No external audio files needed — everything is synthesized at
// runtime, so there's nothing extra to host or load.

let audioContext: AudioContext | null = null;

const getContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
  try {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Sound playback failed:', error);
  }
};

export const sounds = {
  hit: () => {
    playTone(180, 0.12, 'square', 0.12);
    setTimeout(() => playTone(90, 0.08, 'sawtooth', 0.08), 30);
  },

  block: () => {
    playTone(440, 0.08, 'triangle', 0.1);
  },

  fightStart: () => {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  },

  victory: () => {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.5, 'triangle', 0.12), i * 100);
    });
  },

  defeat: () => {
    [400, 300, 200].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'sawtooth', 0.1), i * 150);
    });
  },

  click: () => {
    playTone(600, 0.05, 'sine', 0.06);
  },
};

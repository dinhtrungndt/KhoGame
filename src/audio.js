let audioContext;
let musicTimer;
let musicStep = 0;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

export function unlockAudio() { getContext(); }

function tone(frequency, start, duration, type = 'sine', volume = 0.08) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

const melodies = {
  enter: [[392, 0], [523, 0.09], [659, 0.18]],
  start: [[392, 0], [523, 0.11], [659, 0.22], [784, 0.33]],
  deal: [[740, 0], [520, 0.07], [740, 0.15]],
  draw: [[440, 0], [587, 0.07]],
  play: [[587, 0], [784, 0.055]],
  skip: [[659, 0], [440, 0.09]],
  attack: [[440, 0], [440, 0.1], [659, 0.2]],
  nope: [[587, 0], [392, 0.1]],
  defuse: [[392, 0], [523, 0.12], [784, 0.24]],
  bomb: [[220, 0], [165, 0.13], [110, 0.27]],
  turn: [[659, 0], [784, 0.08]],
  win: [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.48], [784, 0.7], [1047, 0.9]],
};

export function playSfx(name, enabled = true) {
  if (!enabled) return;
  const ctx = getContext();
  const notes = melodies[name];
  if (!ctx || !notes) return;
  const now = ctx.currentTime + 0.015;
  notes.forEach(([frequency, offset], index) => tone(frequency, now + offset, name === 'win' ? 0.28 : 0.13, name === 'bomb' ? 'sawtooth' : index % 2 ? 'triangle' : 'sine', name === 'win' ? 0.095 : 0.065));
}

export function setMusicEnabled(enabled) {
  if (!enabled) {
    window.clearInterval(musicTimer);
    musicTimer = undefined;
    return;
  }
  if (musicTimer) return;
  const ctx = getContext();
  if (!ctx) return;
  const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
  musicTimer = window.setInterval(() => {
    const context = getContext();
    if (!context) return;
    const root = notes[musicStep % notes.length];
    const now = context.currentTime + 0.02;
    tone(root, now, 1.25, 'sine', 0.018);
    tone(root * 1.5, now, 1.25, 'sine', 0.009);
    musicStep += 1;
  }, 1700);
}

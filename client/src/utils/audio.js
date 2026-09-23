let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type, duration, delay = 0, gainLevel = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }, delay);
  } catch (e) {
    // ignore audio errors
  }
}

export function playChime(chimeType) {
  if (chimeType === 'ready') {
    playTone(523.25, 'sine', 0.4, 0, 0.15);
    playTone(659.25, 'sine', 0.4, 110, 0.15);
    playTone(783.99, 'sine', 0.5, 220, 0.16);
  } else if (chimeType === 'start') {
    playTone(440, 'sine', 0.2, 0, 0.12);
    playTone(587.33, 'sine', 0.25, 90, 0.14);
  } else if (chimeType === 'assign') {
    playTone(523.25, 'sine', 0.2, 0, 0.12);
  }
}

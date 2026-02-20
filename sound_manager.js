class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;

    // Attempt to initialize on user interaction if blocked
    this.init = this.init.bind(this);
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Default volume
    this.masterGain.connect(this.ctx.destination);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Basic tone generator
  playTone(freq, type, duration, startTime = 0, vol = 1) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  // White noise generator
  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playNoise(duration, startTime = 0, vol = 1, filterFreq = 1000) {
    if (!this.enabled || !this.ctx) return;
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(this.ctx.currentTime + startTime);
    source.stop(this.ctx.currentTime + startTime + duration);
  }

  // --- Sound Effects ---

  // Card Snap (Sharp, high-pitch click)
  playSnap() {
    this.init(); // Ensure init
    // High frequency tone burst
    this.playTone(800, 'square', 0.05, 0, 0.5);
    // Short noise burst
    this.playNoise(0.05, 0, 0.8, 2000);
  }

  // Card Slide (Soft noise)
  playSlide() {
    this.init();
    this.playNoise(0.15, 0, 0.4, 800);
  }

  // Card Stick/Place (Wood block sound)
  playStick() {
    this.init();
    this.playTone(300, 'sine', 0.1, 0, 0.8);
    this.playNoise(0.05, 0, 0.5, 500);
  }

  // Match (Chime/Ding)
  playMatch() {
    this.init();
    // Two tones for a "ding-dong" or just a nice chime
    this.playTone(880, 'sine', 0.6, 0, 0.6); // A5
    this.playTone(1760, 'sine', 0.6, 0.05, 0.3); // A6 (harmonic)
  }

  // Get Point/Bonus (Higher pitch chime)
  playPoint() {
    this.init();
    this.playTone(1046.5, 'sine', 0.4, 0, 0.6); // C6
    this.playTone(1318.5, 'sine', 0.4, 0.1, 0.4); // E6
  }

  // Go (Energetic Rising)
  playGo() {
    this.init();
    const now = 0;
    this.playTone(523.25, 'triangle', 0.3, now, 0.6); // C5
    this.playTone(659.25, 'triangle', 0.3, now + 0.1, 0.6); // E5
    this.playTone(783.99, 'triangle', 0.6, now + 0.2, 0.6); // G5
  }

  // Stop (Final, solid chord)
  playStop() {
    this.init();
    const now = 0;
    // C Major chord, punchy
    this.playTone(261.63, 'square', 0.4, now, 0.5); // C4
    this.playTone(329.63, 'square', 0.4, now, 0.5); // E4
    this.playTone(392.00, 'square', 0.4, now, 0.5); // G4
  }

  // Win (Fanfare)
  playWin() {
    this.init();
    const now = 0;
    const speed = 0.1;
    // C G E C
    this.playTone(523.25, 'sine', 0.2, now, 0.6);
    this.playTone(783.99, 'sine', 0.2, now + speed, 0.6);
    this.playTone(1046.5, 'sine', 0.2, now + speed*2, 0.6);
    this.playTone(1318.5, 'square', 0.6, now + speed*3, 0.4);
  }

  // Lose (Sad trombone-ish)
  playLose() {
    this.init();
    const now = 0;
    const speed = 0.3;
    // G F# F
    this.playTone(392.00, 'sawtooth', speed, now, 0.5);
    this.playTone(369.99, 'sawtooth', speed, now + speed, 0.5);
    this.playTone(349.23, 'sawtooth', speed*2, now + speed*2, 0.5);
  }

  // Warning/Bomb/Chong-tong (Alarm-ish)
  playWarning() {
    this.init();
    const now = 0;
    this.playTone(800, 'sawtooth', 0.1, now, 0.5);
    this.playTone(800, 'sawtooth', 0.1, now + 0.15, 0.5);
  }
}

// Global instance
const soundManager = new SoundManager();

// Attempt to init on first click anywhere
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    soundManager.init();
  }, { once: true });
}

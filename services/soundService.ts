
class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.volume;
    }
  }

  // Call this on first user interaction
  public async resumeContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public play(sound: 'message' | 'join' | 'leave' | 'mute' | 'unmute' | 'deafen' | 'undeafen') {
    this.init();
    if (!this.ctx) return;

    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(console.error);
    }

    const now = this.ctx.currentTime;

    switch (sound) {
      case 'message':
        // Discord-like "Pop"
        this.playTone(800, 'sine', 0.1);
        break;

      case 'join':
        // Rising pleasant chime
        this.playTone(400, 'sine', 0.1, 0);
        this.playTone(600, 'sine', 0.3, 0.1);
        break;

      case 'leave':
        // Falling chime
        this.playTone(600, 'sine', 0.1, 0);
        this.playTone(400, 'sine', 0.3, 0.1);
        break;

      case 'mute':
        // Dull thud
        this.playTone(200, 'triangle', 0.1);
        break;

      case 'unmute':
        // Higher click
        this.playTone(400, 'triangle', 0.1);
        break;
        
      case 'deafen':
         this.playTone(200, 'sawtooth', 0.15);
         break;

      case 'undeafen':
         this.playTone(400, 'sawtooth', 0.15);
         break;
    }
  }
}

export const soundService = new SoundService();

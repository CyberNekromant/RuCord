
class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private enabled: boolean = true;
  private activeOscillators: OscillatorNode[] = [];

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

  public stopAll() {
      this.activeOscillators.forEach(osc => {
          try { osc.stop(); } catch(e){}
          try { osc.disconnect(); } catch(e){}
      });
      this.activeOscillators = [];
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, loop: boolean = false) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
    if (!loop) {
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime + startTime);
    if (!loop) {
        osc.stop(this.ctx.currentTime + startTime + duration);
    } else {
        this.activeOscillators.push(osc);
    }
  }

  public playRingtone() {
      this.init();
      if (!this.ctx) return;
      this.stopAll(); // Stop previous sounds

      // Simulate a digital phone ring (looping)
      const playRing = () => {
          if (this.activeOscillators.length > 0) return; // Already ringing logic handled externally usually, but for simple loop:
          
          // Simple repeating pattern handled by setInterval in UI or complex oscillator logic here.
          // Let's do a long oscillator for now
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, this.ctx!.currentTime);
          
          // Modulation for "Ringing" effect
          const lfo = this.ctx!.createOscillator();
          lfo.type = 'square';
          lfo.frequency.value = 15; // 15Hz flutter
          const lfoGain = this.ctx!.createGain();
          lfoGain.gain.value = 500;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();
          
          gain.gain.value = 0.1;
          
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start();
          
          this.activeOscillators.push(osc);
          this.activeOscillators.push(lfo);
      }
      playRing();
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
        this.playTone(800, 'sine', 0.1);
        break;
      case 'join':
        this.playTone(400, 'sine', 0.1, 0);
        this.playTone(600, 'sine', 0.3, 0.1);
        break;
      case 'leave':
        this.playTone(600, 'sine', 0.1, 0);
        this.playTone(400, 'sine', 0.3, 0.1);
        break;
      case 'mute':
        this.playTone(200, 'triangle', 0.1);
        break;
      case 'unmute':
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

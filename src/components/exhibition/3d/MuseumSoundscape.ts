'use client';

/**
 * High-quality Procedural Museum Soundscape Generator using Web Audio API
 * Generates soothing museum room acoustic reverberation, gentle harmonic pads, and calming tones.
 */
class MuseumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private oscillators: OscillatorNode[] = [];
  private intervals: NodeJS.Timeout[] = [];

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  public startSoundscape(preset: 'museum' | 'river' | 'piano' = 'museum') {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stopSoundscape();
    this.isPlaying = true;

    // 1. Ambient Warm Pad (Ethereal chords: D, F#, A, C# - Peace & Art)
    const baseFreqs = preset === 'river' 
      ? [146.83, 220.0, 293.66, 440.0] // D3, A3, D4, A4
      : preset === 'piano'
      ? [164.81, 196.0, 246.94, 329.63] // E3, G3, B3, E4
      : [130.81, 196.0, 261.63, 329.63]; // C3, G3, C4, E4

    baseFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 + idx * 80, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.03 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.oscillators.push(osc);
    });

    // 2. Soft Random Gallery Chimes / Harmonic Resonances every 4-8 seconds
    const chimeNotes = [440.0, 523.25, 659.25, 783.99, 880.0];
    const chimeTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;

      const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.6);
    }, 4500);

    this.intervals.push(chimeTimer);
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stopSoundscape() {
    this.isPlaying = false;
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.oscillators = [];
    this.intervals.forEach((timer) => clearInterval(timer));
    this.intervals = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const museumAudio = new MuseumAudioEngine();

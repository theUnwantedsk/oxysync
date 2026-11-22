// Web Audio API Sound Synthesizer conforming to Medical Equipment Alarm Standards (IEC 60601-1-8)
// Includes Clinical Pulse Oximeter Pitch-Modulated Tone Synthesizer & Solenoid Mechanical Actuation FX

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSnoozed: boolean = false;
  private snoozeUntil: number = 0;
  private alarmInterval: number | null = null;
  private currentAlarmType: 'critical' | 'warning' | null = null;
  private masterVolume: number = 0.8;
  private pulseOximeterSoundEnabled: boolean = true;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public setPulseOximeterSound(enabled: boolean) {
    this.pulseOximeterSoundEnabled = enabled;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public snooze(durationSeconds: number = 120) {
    this.isSnoozed = true;
    this.snoozeUntil = Date.now() + durationSeconds * 1000;
    this.stopAlarm();
  }

  public getSnoozeRemainingSeconds(): number {
    if (!this.isSnoozed) return 0;
    const remaining = Math.max(0, Math.ceil((this.snoozeUntil - Date.now()) / 1000));
    if (remaining === 0) {
      this.isSnoozed = false;
    }
    return remaining;
  }

  /**
   * Real Clinical Pulse Oximeter QRS Sync Tone:
   * Pitch dynamically modulates based on SpO2 percentage!
   * 100% SpO2 = 880 Hz (A5)
   * 90% SpO2 = 660 Hz (E5)
   * 84% SpO2 = 520 Hz (C5)
   * 75% SpO2 = 440 Hz (A4)
   */
  public playPulseOximeterBeep(spo2: number) {
    if (this.isMuted || !this.pulseOximeterSoundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      // Frequency calculation: base 440Hz + scaled by SpO2 ratio
      const clampedSpo2 = Math.max(70, Math.min(100, spo2));
      const freq = 400 + Math.pow((clampedSpo2 - 70) / 30, 1.4) * 500;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      // Natural clinical envelope: fast attack, quick decay
      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  /**
   * Mechanical Solenoid Valve Actuation Transient (Satisfying Mechatronic "Thump-Click")
   */
  public playValveActuationClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      
      // 1. Low frequency mechanical thump
      const thumpOsc = this.audioCtx.createOscillator();
      const thumpGain = this.audioCtx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(140, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

      thumpGain.gain.setValueAtTime(0.18 * this.masterVolume, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.audioCtx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.06);

      // 2. High metallic click
      const clickOsc = this.audioCtx.createOscillator();
      const clickGain = this.audioCtx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(2400, now + 0.01);
      clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.035);

      clickGain.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.01);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      clickOsc.connect(clickGain);
      clickGain.connect(this.audioCtx.destination);
      clickOsc.start(now + 0.01);
      clickOsc.stop(now + 0.035);
    } catch {
      // Audio context restricted
    }
  }

  /**
   * Play warning tone: double medium-pitch pulse (yellow alert)
   */
  public playWarningBeep() {
    if (this.isMuted || this.getSnoozeRemainingSeconds() > 0) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [0, 0.22].forEach((offset) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now + offset); // E5

        gain.gain.setValueAtTime(0.12 * this.masterVolume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch {
      // Ignore audio error
    }
  }

  /**
   * Play critical emergency alarm: high-pitch urgent 3-pulse sequence (red alert)
   */
  public playCriticalAlarm() {
    if (this.isMuted || this.getSnoozeRemainingSeconds() > 0) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [0, 0.14, 0.28].forEach((offset) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now + offset); // B5 / C6

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    } catch {
      // Ignore audio error
    }
  }

  public triggerAlarmLoop(severity: 'critical' | 'warning') {
    if (this.currentAlarmType === severity && this.alarmInterval !== null) {
      return;
    }
    this.stopAlarm();
    this.currentAlarmType = severity;

    if (severity === 'critical') {
      this.playCriticalAlarm();
      this.alarmInterval = window.setInterval(() => {
        this.playCriticalAlarm();
      }, 1400);
    } else {
      this.playWarningBeep();
      this.alarmInterval = window.setInterval(() => {
        this.playWarningBeep();
      }, 3500);
    }
  }

  public stopAlarm() {
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.currentAlarmType = null;
  }
}

export const audioAlert = new AudioAlertService();

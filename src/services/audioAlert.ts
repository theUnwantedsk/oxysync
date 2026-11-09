// Web Audio API Sound Synthesizer conforming to Medical Equipment Alarm Standards (IEC 60601-1-8 inspired)

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSnoozed: boolean = false;
  private snoozeUntil: number = 0;
  private alarmInterval: number | null = null;
  private currentAlarmType: 'critical' | 'warning' | null = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
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
   * Subtle heartbeat / QRS sync blip tone
   */
  public playHeartbeatBlip(frequency: number = 880) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted before user interaction
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

        gain.gain.setValueAtTime(0.12, now + offset);
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
      // IEC 60601-1-8 high-priority alarm pattern (C6 - 1046.5Hz)
      [0, 0.14, 0.28].forEach((offset) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now + offset); // B5 / C6

        gain.gain.setValueAtTime(0.25, now + offset);
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

  /**
   * Start recurring alarm loop based on highest active severity
   */
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

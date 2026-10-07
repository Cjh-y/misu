import type { SceneId } from '../../core/types';
type Sound = 'step' | 'door' | 'paper' | 'evidence' | 'travel';
/** Original, locally synthesized score and foley: no network requests or autoplay. */
export class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private timer?: number;
  private beat = 0;
  private scene: SceneId = '221b';
  private enabled = true;
  private active = false;
  constructor() {
    try { this.enabled = localStorage.getItem('misu.audio') !== 'off'; } catch { /* file:// */ }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { void this.context?.suspend(); }
      else if (this.active && this.enabled) { void this.context?.resume(); }
    });
  }
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain(); this.master.gain.value = .45;
        this.master.connect(this.context.destination);
        this.music = this.context.createGain(); this.music.gain.value = .22; this.music.connect(this.master);
      }
      await this.context.resume();
      if (!this.timer) this.timer = window.setInterval(() => this.score(), 900);
      this.report();
    } catch { /* Audio is optional when the browser does not support it. */ }
  }
  setScene(scene: SceneId) { this.scene = scene; this.beat = 0; this.report(); }
  setActive(active: boolean) { this.active = active; this.report(); }
  isEnabled() { return this.enabled; }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('misu.audio', this.enabled ? 'on' : 'off'); } catch { /* file:// */ }
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.enabled ? .45 : 0, this.context.currentTime, .1);
    if (this.enabled) void this.unlock();
    this.report();
  }
  private report() {
    window.dispatchEvent(new CustomEvent('misu:audio-state', { detail: { enabled: this.enabled, active: this.active, scene: this.scene, state: this.context?.state ?? 'locked' } }));
  }
  private note(frequency: number, duration: number, volume: number, destination?: AudioNode, delay = 0) {
    const ctx = this.context;
    if (!ctx || !this.master || ctx.state !== 'running' || !this.enabled) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime + delay;
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(destination ?? this.master);
    osc.start(now); osc.stop(now + duration + .1);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  private score() {
    if (!this.active || document.hidden) return;
    const phrase = this.scene === '221b' ? [146.83, 220, 174.61, 196, 164.81, 220, 130.81, 164.81]
      : this.scene === 'hall' ? [110, 164.81, 130.81, 146.83, 103.83, 155.56, 123.47, 146.83]
      : [130.81, 196, 155.56, 174.61, 123.47, 185, 146.83, 164.81];
    this.note(phrase[this.beat % phrase.length], 2.4, .12, this.music);
    if (this.beat % 4 === 0) this.note(phrase[this.beat % phrase.length] / 2, 3.5, .1, this.music);
    this.beat++;
  }
  play(sound: Sound, rug = false) {
    if (!this.active) return;
    if (sound === 'evidence') { this.note(523.25, .5, .12); this.note(783.99, .8, .08, undefined, .12); }
    else if (sound === 'travel') { this.note(146.83, 1.2, .09); this.note(220, 1.4, .07, undefined, .12); }
    else {
      const ctx = this.context;
      if (!ctx || !this.master || ctx.state !== 'running' || !this.enabled) return;
      const duration = sound === 'door' ? .28 : sound === 'paper' ? .13 : .07;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = sound === 'paper' ? 1800 : sound === 'door' ? 280 : rug ? 180 : 450;
      gain.gain.value = sound === 'step' ? (rug ? .06 : .1) : .16;
      source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start();
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    }
  }
}

// Story-Modus music player: plays one song from `story-songs.ts` at a time as a looping chiptune
// (lead, chord arpeggio, bass, drums) and crossfades when the place changes.
import { BARS, SONG_STEPS, STEPS_PER_BAR, chordNotes, melodyNotes, songById, type Note, type Song, type Wave } from "./story-songs";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
/** Shared limiter so loud boss songs never clip. */
let master: DynamicsCompressorNode | null = null;
const waves = new Map<string, PeriodicWave>();
type Player = { song: Song; notes: Map<number, Note>; bus: GainNode; echo: GainNode; timer: number; step: number; next: number };
let current: Player | null = null;

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function pulse(duty: number) {
  const key = String(duty);
  let w = waves.get(key);
  if (!w && ctx) {
    const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    w = ctx.createPeriodicWave(real, imag); waves.set(key, w);
  }
  return w!;
}
function osc(wave: Wave) {
  const o = ctx!.createOscillator();
  if (wave === "pulse25") o.setPeriodicWave(pulse(0.25));
  else if (wave === "pulse12") o.setPeriodicWave(pulse(0.125));
  else o.type = wave;
  return o;
}
function note(midi: number, at: number, len: number, wave: Wave, vol: number, dest: AudioNode, vibrato = false) {
  if (!ctx) return;
  const o = osc(wave), g = ctx.createGain(), end = at + Math.max(len, 0.05);
  o.frequency.value = hz(midi);
  if (vibrato && len > 0.3) {
    const lfo = ctx.createOscillator(), d = ctx.createGain();
    lfo.frequency.value = 5.5; d.gain.setValueAtTime(0, at); d.gain.linearRampToValueAtTime(12, at + len * 0.6);
    lfo.connect(d).connect(o.detune); lfo.start(at); lfo.stop(end + 0.05);
  }
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.setValueAtTime(vol, Math.max(at + 0.01, end - 0.06)); g.gain.exponentialRampToValueAtTime(0.0001, end);
  o.connect(g).connect(dest); o.start(at); o.stop(end + 0.03);
}
function hit(at: number, vol: number, len: number, type: BiquadFilterType, freq: number, dest: AudioNode) {
  if (!ctx || !noise) return;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  s.connect(f).connect(g).connect(dest); s.start(at, (at * 7.31) % 1.5, len + 0.02);
}
function kick(at: number, vol: number, dest: AudioNode) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(45, at + 0.1);
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  o.connect(g).connect(dest); o.start(at); o.stop(at + 0.25);
}
function bongo(at: number, midi: number, dest: AudioNode) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(hz(midi) * 1.4, at); o.frequency.exponentialRampToValueAtTime(hz(midi), at + 0.05);
  g.gain.setValueAtTime(0.18, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  o.connect(g).connect(dest); o.start(at); o.stop(at + 0.18);
}

/** Schedules one eighth-note step of a song (sub-steps for 16th-note parts). */
function schedule(p: Player, step: number, at: number, tick: number) {
  const s = p.song, k = step % SONG_STEPS, bar = Math.floor(k / STEPS_PER_BAR), beat = k % STEPS_PER_BAR, dest = p.bus;
  const chord = chordNotes(s, bar), root = chord[0]! - 12;
  // Lead melody (with a quiet echo copy for spacey songs)
  const n = p.notes.get(k);
  if (n) {
    const loud = s.lead === "sawtooth" ? 0.05 : s.lead === "sine" || s.lead === "triangle" ? 0.13 : 0.07;
    note(n.midi, at, n.len * tick * 0.95, s.lead, loud, dest, true);
    if (s.arp || s.lead === "sine") note(n.midi + 12, at, n.len * tick * 0.6, "sine", 0.025, p.echo);
  }
  // Chord arpeggio in 16ths, or soft chord pad at the bar start
  if (s.arp) for (const h of [0, 1]) note(chord[(beat * 2 + h) % 3]! + 12, at + h * tick / 2, tick * 0.45, "pulse12", 0.025, dest);
  else if (beat === 0) for (const c of chord) note(c, at, tick * 7.5, "triangle", 0.03, dest);
  // Bass
  const b = (m: number, t: number, l: number, v = 0.16) => note(m, t, l, "triangle", v, dest);
  switch (s.bass) {
    case "pulse": b(root, at, tick * 0.8); break;
    case "walk": if (beat % 2 === 0) b([root, root + 7, root + 12, root + 7][beat / 2]!, at, tick * 1.8); break;
    case "octave": b(beat % 2 ? root + 12 : root, at, tick * 0.8); break;
    case "gallop": b(root, at, tick * 0.45); b(root, at + tick / 2, tick * 0.22); b(root + (beat % 4 === 3 ? 7 : 0), at + tick * 0.75, tick * 0.22); break;
    case "drone": if (beat === 0) b(root, at, tick * 7.8, 0.14); if (beat === 4) b(root + 7, at, tick * 3.8, 0.09); break;
    case "offbeat": if (beat % 2) b(beat === 7 ? root + 7 : root, at, tick * 0.8); else if (beat === 0) b(root - 12, at, tick * 0.8, 0.12); break;
  }
  // Drums
  const hat = (t: number, v = 0.035) => hit(t, v, 0.03, "highpass", 8000, dest);
  const snare = (t: number, v = 0.12) => hit(t, v, 0.12, "bandpass", 1800, dest);
  switch (s.drums) {
    case "soft": if (beat % 2 === 0) hat(at, 0.025); if (beat === 0) kick(at, 0.35, dest); break;
    case "march": if (beat % 4 === 0) kick(at, 0.5, dest); if (beat === 2 || beat === 6) snare(at); if (bar % 4 === 3 && beat >= 6) { snare(at, 0.08); snare(at + tick / 2, 0.1); } hat(at, 0.02); break;
    case "rock": if (beat === 0 || beat === 3 || beat === 4) kick(at, 0.6, dest); if (beat === 2 || beat === 6) snare(at, 0.16); hat(at); break;
    case "shuffle": if (beat === 0 || beat === 4) kick(at, 0.45, dest); if (beat === 2 || beat === 6) snare(at, 0.09); hat(at + (beat % 2 ? tick * 0.18 : 0), 0.03); break;
    case "disco": if (beat % 2 === 0) kick(at, 0.55, dest); if (beat === 2 || beat === 6) snare(at, 0.13); if (beat % 2) hit(at, 0.06, 0.14, "highpass", 6500, dest); break;
    case "heavy": kick(at, 0.55, dest); if (beat === 2 || beat === 6) snare(at, 0.18); if (beat % 2) kick(at + tick / 2, 0.4, dest); hat(at, 0.03); break;
    case "hand": bongo(at, [60, 0, 67, 60, 0, 60, 67, 0][beat]! || 0, dest); if (beat === 0 || beat === 5) hat(at, 0.03); break;
    case "none": if (beat === 0 && bar % 2 === 0) hit(at, 0.03, 1.2, "highpass", 6000, p.echo); break;
  }
  // Crash every 8 bars for the loud songs
  if (k === 0 && (s.drums === "rock" || s.drums === "heavy" || s.drums === "disco")) hit(at, 0.12, 1.2, "highpass", 5000, dest);
}

function boot() {
  ctx ??= new AudioContext();
  void ctx.resume();
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); let seed = 1;
    for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; }
  }
  if (!master) {
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -12; master.ratio.value = 6; master.attack.value = 0.003; master.release.value = 0.2;
    master.connect(ctx.destination);
  }
  return ctx;
}
function stop(p: Player, fade: number) {
  window.clearInterval(p.timer);
  const c = ctx!, t = c.currentTime;
  p.bus.gain.cancelScheduledValues(t); p.bus.gain.setValueAtTime(p.bus.gain.value, t); p.bus.gain.linearRampToValueAtTime(0.0001, t + fade);
  window.setTimeout(() => { p.bus.disconnect(); p.echo.disconnect(); }, fade * 1000 + 1500);
}

/** The id of the song that is playing right now (null when silent). */
export const playingSong = () => current?.song.id ?? null;

/** Plays a song on loop, crossfading from whatever was playing. Same id again = keeps playing. Null = silence. */
export function playStorySong(id: string | null) {
  if (typeof window === "undefined") return;
  if ((current?.song.id ?? null) === id) { if (ctx?.state === "suspended") void ctx.resume(); return; }
  const song = id ? songById(id) : undefined;
  if (current) { stop(current, 0.7); current = null; }
  document.documentElement.dataset["storySong"] = song?.id ?? "";
  if (!song) return;
  const c = boot(), tick = 60 / song.bpm / 2;
  const bus = c.createGain(), echo = c.createGain(), delay = c.createDelay(1), fb = c.createGain(), damp = c.createBiquadFilter();
  bus.gain.setValueAtTime(0.0001, c.currentTime); bus.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.8);
  bus.connect(master!);
  delay.delayTime.value = tick * 1.5; fb.gain.value = 0.35; damp.type = "lowpass"; damp.frequency.value = 2600;
  echo.connect(delay).connect(damp).connect(fb).connect(delay); damp.connect(bus);
  const p: Player = { song, notes: new Map(melodyNotes(song).map((n) => [n.step, n])), bus, echo, timer: 0, step: 0, next: c.currentTime + 0.1 };
  p.timer = window.setInterval(() => {
    if (!ctx) return;
    // After a long pause (tab hidden), jump ahead instead of playing a burst of old notes.
    if (p.next < ctx.currentTime - 0.5) p.next = ctx.currentTime + 0.05;
    while (p.next < ctx.currentTime + 0.2) { schedule(p, p.step, p.next, tick); p.step++; p.next += tick; }
  }, 40);
  current = p;
}
export const stopStorySong = () => playStorySong(null);
/** Browsers start audio only after a tap or key press; call this from such an event to wake it up. */
export function wakeStoryMusic() { if (ctx && ctx.state === "suspended") void ctx.resume(); }
export const LOOP_BARS = BARS;

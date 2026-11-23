// "AFTERLIFE REMAKE ANTHEM" – original 132 BPM melodic rave track in D minor: punchy kick with rumble,
// sidechain pump, rolling offbeat bass, acid arpeggio, ghost-choir pads, echo bells, supersaw lead,
// snare build-ups, risers, impact booms and two drops.
let ctx: AudioContext | null = null;
let timer: number | null = null;
let bus: GainNode | null = null;
let pump: GainNode | null = null;
let echo: GainNode | null = null;
let noise: AudioBuffer | null = null;
export const BPM = 132;
// Dm – Bb – F – C, two bars each.
const CHORDS = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]];
// 64 eighth notes = 8 bars of lead melody (0 = rest).
const LEAD = [
  74, 0, 77, 0, 81, 79, 77, 0, 76, 0, 74, 0, 72, 74, 0, 0,
  70, 0, 74, 0, 77, 76, 74, 0, 72, 0, 70, 0, 69, 70, 0, 0,
  72, 0, 77, 0, 81, 0, 84, 81, 79, 0, 77, 0, 76, 77, 0, 0,
  76, 0, 79, 0, 84, 0, 86, 84, 81, 79, 77, 76, 74, 77, 81, 0,
];
// Ghost bells for the break: sparse, high and drenched in echo.
const BELLS = [86, 0, 0, 81, 0, 0, 77, 0, 84, 0, 0, 79, 0, 0, 76, 0];
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
function tone(midi: number, at: number, duration: number, type: OscillatorType, volume: number, dest: AudioNode, detune = 0, cutoff = 0, attack = .008, q = 6) {
  if (!ctx || !midi) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = hz(midi); o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(volume, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(duration, attack + .02));
  if (cutoff) {
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = q;
    f.frequency.setValueAtTime(cutoff * 3, at); f.frequency.exponentialRampToValueAtTime(cutoff, at + duration * .7);
    o.connect(f).connect(g);
  } else o.connect(g);
  g.connect(dest); o.start(at); o.stop(at + Math.max(duration, attack + .02) + .03);
}
function supersaw(midi: number, at: number, duration: number, volume: number, dest: AudioNode) {
  for (const d of [-19, -8, 0, 8, 19]) tone(midi, at, duration, "sawtooth", volume, dest, d, 3000);
  tone(midi - 12, at, duration, "square", volume * .6, dest, 0, 1800);
}
/** Airy ghost choir: slow-attack triangle stack with a gentle vibrato. */
function choir(midi: number, at: number, duration: number, volume: number) {
  if (!ctx || !pump) return;
  for (const d of [-12, 0, 11]) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    o.type = "triangle"; o.frequency.value = hz(midi); o.detune.value = d;
    lfo.frequency.value = 5.2; depth.gain.value = 9; lfo.connect(depth).connect(o.detune);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(volume, at + duration * .35); g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    o.connect(g); g.connect(pump); if (echo) g.connect(echo);
    o.start(at); lfo.start(at); o.stop(at + duration + .05); lfo.stop(at + duration + .05);
  }
}
function hit(at: number, volume: number, length: number, type: BiquadFilterType, freq: number, dest: AudioNode, q = 1) {
  if (!ctx || !noise) return;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(volume, at); g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  s.connect(f).connect(g).connect(dest); s.start(at, Math.random() * 1.5, length + .02);
}
function kick(at: number, rumble: boolean) {
  if (!ctx || !bus || !pump) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(200, at); o.frequency.exponentialRampToValueAtTime(40, at + .11);
  g.gain.setValueAtTime(1, at); g.gain.exponentialRampToValueAtTime(.0001, at + .34);
  o.connect(g).connect(bus); o.start(at); o.stop(at + .36);
  // Techno rumble: a filtered, delayed low tail after every kick.
  if (rumble) tone(38, at + .11, .3, "sawtooth", .12, pump, 0, 140, .02, 2);
  pump.gain.setValueAtTime(.22, at); pump.gain.linearRampToValueAtTime(1, at + .22);
}
function impact(at: number) {
  if (!ctx || !bus) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(130, at); o.frequency.exponentialRampToValueAtTime(28, at + 1.4);
  g.gain.setValueAtTime(.7, at); g.gain.exponentialRampToValueAtTime(.0001, at + 1.6);
  o.connect(g).connect(bus); o.start(at); o.stop(at + 1.65);
  hit(at, .45, 2.2, "lowpass", 1400, bus);
}
function riser(at: number, duration: number) {
  if (!ctx || !noise || !pump) return;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; s.loop = true; f.type = "bandpass"; f.Q.value = 3;
  f.frequency.setValueAtTime(300, at); f.frequency.exponentialRampToValueAtTime(9000, at + duration);
  g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(.24, at + duration);
  s.connect(f).connect(g).connect(pump); s.start(at); s.stop(at + duration + .02);
}
export function sectionAt(bar: number): "intro" | "groove" | "build" | "drop" | "break" | "drop2" {
  const b = ((bar % 64) + 64) % 64;
  return b < 8 ? "intro" : b < 16 ? "groove" : b < 24 ? "build" : b < 40 ? "drop" : b < 48 ? "break" : b < 56 ? "build" : "drop2";
}
function schedule(step: number, at: number, tick: number) {
  if (!bus || !pump) return;
  const s16 = step % 16, bar = Math.floor(step / 16), sec = sectionAt(bar);
  const chord = CHORDS[Math.floor(bar / 2) % 4] ?? [50, 53, 57];
  const root = chord[0] ?? 50;
  const lastBuildBar = sec === "build" && (bar % 64 === 23 || bar % 64 === 55);
  const drop = sec === "drop" || sec === "drop2";
  if (drop && s16 === 0 && (bar % 64 === 24 || bar % 64 === 56)) impact(at);
  // Kick (with rumble from the groove on)
  if (sec !== "break" && !lastBuildBar && s16 % 4 === 0) kick(at, sec !== "intro");
  // Clap on 2 and 4
  if ((drop || sec === "groove") && (s16 === 4 || s16 === 12)) { hit(at, .5, .16, "bandpass", 1500, pump, 1.4); hit(at + .014, .3, .11, "bandpass", 1050, pump); if (echo) hit(at, .12, .12, "bandpass", 1500, echo); }
  // Snare build-up roll, getting faster
  if (sec === "build") {
    const inBuild = bar % 8, every = inBuild < 4 ? 4 : inBuild < 6 ? 2 : 1;
    if (s16 % every === 0) hit(at, .12 + inBuild * .045, .09, "bandpass", 1800 + inBuild * 450, pump);
    if (inBuild === 0 && s16 === 0) riser(at, tick * 16 * 8);
  }
  // Hats: closed 16ths, open on offbeats, shaker ghost notes in drops
  if (sec !== "break") hit(at, s16 % 2 ? .05 : .08, .03, "highpass", 8500, pump);
  if (sec !== "intro" && sec !== "break" && s16 % 4 === 2) hit(at, .15, .18, "highpass", 6500, pump);
  if (drop && s16 % 2 === 1) hit(at, .04, .05, "bandpass", 11000, pump, 2);
  // Rolling bass: offbeat 16ths
  if (sec !== "break" && s16 % 4 !== 0) tone(root - 12, at, tick * .9, "sawtooth", drop ? .21 : .14, pump, 0, drop ? 950 : 520);
  // Sub on the downbeat in drops
  if (drop && s16 === 0) tone(root - 24, at, tick * 14, "sine", .26, pump);
  // Acid arpeggio with an opening filter across each 8-bar phrase
  if (sec !== "intro") {
    const arp = [0, 1, 2, 1, 2, 0, 2, 1][step % 8] ?? 0;
    const open = 900 + (bar % 8) * 380;
    tone((chord[arp] ?? root) + (drop ? 24 : 12), at, tick * .85, "sawtooth", sec === "break" ? .04 : .03, pump, 0, open, .006, 12);
  }
  // Ghost choir pads in intro, break and build
  if ((sec === "intro" || sec === "break" || sec === "build") && step % 32 === 0) chord.forEach(n => choir(n + 12, at, tick * 31, .018));
  // Echo bells in the break
  if (sec === "break" && step % 2 === 0) { const b = BELLS[Math.floor(step / 2) % BELLS.length] ?? 0; if (b && echo) tone(b, at, tick * 6, "sine", .07, echo, 0, 0, .004); }
  // Supersaw lead in drops (octave higher in drop 2) + chord stabs
  if (drop && step % 2 === 0) {
    const n = LEAD[Math.floor(step / 2) % LEAD.length] ?? 0;
    if (n) { supersaw(n + (sec === "drop2" ? 12 : 0) - 12, at, tick * 1.9, .022, pump); if (echo) tone(n + 12, at, tick, "triangle", .02, echo); }
  }
  if (drop && (s16 === 6 || s16 === 14)) chord.forEach(n => tone(n + 12, at, tick * 1.2, "sawtooth", .03, pump!, 8, 2400));
  // Crash at section starts
  if (s16 === 0 && bar % 8 === 0 && sec !== "intro") hit(at, .26, 1.6, "highpass", 5000, pump);
}
export function startMusic() {
  if (timer !== null) return;
  ctx ??= new AudioContext(); void ctx.resume();
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .18;
  bus = ctx.createGain(); bus.gain.value = .55; bus.connect(comp).connect(ctx.destination);
  pump = ctx.createGain(); pump.gain.value = 1; pump.connect(bus);
  const tick = 60 / BPM / 4;
  // Dotted-eighth echo send for the spacey Afterlife feel.
  echo = ctx.createGain(); echo.gain.value = .8;
  const delay = ctx.createDelay(1), feedback = ctx.createGain(), damp = ctx.createBiquadFilter();
  delay.delayTime.value = tick * 3; feedback.gain.value = .42; damp.type = "lowpass"; damp.frequency.value = 3200;
  echo.connect(delay).connect(damp).connect(feedback).connect(delay); damp.connect(pump);
  let step = 0; let next = ctx.currentTime + .06;
  timer = window.setInterval(() => {
    if (!ctx) return;
    while (next < ctx.currentTime + .18) { schedule(step, next, tick); step++; next += tick; }
  }, 40);
}
export function stopMusic() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  if (ctx && bus) { const old = bus, oldEcho = echo; old.gain.setTargetAtTime(.0001, ctx.currentTime, .05); window.setTimeout(() => { old.disconnect(); oldEcho?.disconnect(); }, 300); }
  bus = null; pump = null; echo = null;
}
export function beep(midi = 84) {
  ctx ??= new AudioContext(); void ctx.resume();
  tone(midi, ctx.currentTime, .1, "triangle", .07, ctx.destination);
  tone(midi + 7, ctx.currentTime + .05, .1, "square", .03, ctx.destination);
}

export type AudioAlertSound = "chime" | "ping" | "beacon" | "soft";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

const UNLOCK_EVENTS = ["pointerdown", "touchstart", "keydown"] as const;

/**
 * Arms a one-shot user-gesture unlock for the alert AudioContext, and keeps it
 * resumed across tab visibility changes. Returns a cleanup function.
 *
 * WHY: on iOS/iPadOS an AudioContext created outside a user gesture starts
 * `suspended`, and `resume()` called from a non-gesture context (which is
 * where `playAlertSound` runs — a proximity check in the marker loop) does
 * NOT unlock it. Result: after every page load the alerts are silently dead
 * until the user happens to touch the page. On a second screen they never do,
 * so alerts appeared "reset" after each reload and the user had to go poke
 * the settings dialog — a gesture — to bring them back.
 *
 * Playing a zero-gain oscillator inside the gesture is what actually flips
 * WebKit out of `suspended`; `resume()` alone is not reliably enough.
 *
 * The visibilitychange half matters on its own: iPadOS suspends the context
 * whenever the tab goes to the background, which silences a passive second
 * screen even with no reload involved.
 */
export function initAudioAlertUnlock(): () => void {
  if (typeof document === "undefined") return () => {};

  let unlocked = false;

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    removeGestureListeners();
    try {
      const ctx = getAudioContext();
      void ctx.resume();
      // Silent blip — the actual unlock on WebKit.
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.01);
    } catch {
      // Audio not supported — nothing to unlock.
    }
  };

  function removeGestureListeners() {
    for (const type of UNLOCK_EVENTS) {
      document.removeEventListener(type, unlock, true);
    }
  }

  for (const type of UNLOCK_EVENTS) {
    document.addEventListener(type, unlock, true);
  }

  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    if (!audioContext || audioContext.state !== "suspended") return;
    try {
      void audioContext.resume();
    } catch {
      // Ignore — the next gesture retries.
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    removeGestureListeners();
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * The tone's peak gain, clamped to a small positive value.
 *
 * `volume` is no longer always the user's slider: in positional mode it is the
 * distance-scaled gain, which can approach 0. Every tone decays with
 * `exponentialRampToValueAtTime`, which is undefined for 0 and rises instead of
 * falls when the target sits above the peak - hence both the floor here and the
 * relative (`peak * 0.02`) tails at the call sites.
 */
function peakGain(volume: number, headroom: number): number {
  return Math.max(1e-4, volume * headroom);
}

/**
 * Output stage for one tone.
 *
 * A pan of 0 (or an engine without StereoPannerNode) connects straight to the
 * destination, so the non-positional path builds exactly the graph it always
 * did. A fresh panner per play is the correct pattern: nodes are single-use
 * anyway, creating one costs microseconds, and a long-lived panner would mean
 * automating one param across overlapping plays for no gain.
 *
 * StereoPannerNode and not an HRTF PannerNode on purpose: HRTF's selling point
 * is elevation and front/back, which it does not deliver without a
 * personalised transfer function, it sounds worse than a plain pan on
 * speakers, and it convolves per node on a CPU that is already running a game.
 *
 * Returns the release for the chain it built. Callers hang it on
 * `oscillator.onended` so every per-ping node is detached from the graph as
 * soon as the tone is over, independently of when the engine would collect it
 * - positional mode plays up to 2.5 tones per second per type.
 */
function connectOut(
  ctx: AudioContext,
  node: AudioNode,
  pan: number,
): () => void {
  // A tolerance, not truthiness: sin(+-PI) for a marker dead behind is ~1e-16,
  // which must not build a panner for an inaudible pan.
  if (Math.abs(pan) > 1e-6 && typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
    node.connect(panner);
    panner.connect(ctx.destination);
    return () => {
      node.disconnect();
      panner.disconnect();
    };
  }
  node.connect(ctx.destination);
  return () => node.disconnect();
}

function playSound(
  ctx: AudioContext,
  sound: AudioAlertSound,
  volume: number,
  pan: number,
) {
  switch (sound) {
    case "chime":
      playChime(ctx, volume, pan);
      break;
    case "ping":
      playPing(ctx, volume, pan);
      break;
    case "beacon":
      playBeacon(ctx, volume, pan);
      break;
    case "soft":
      playSoft(ctx, volume, pan);
      break;
  }
}

/**
 * True while the shared context exists but is not running (suspended by the
 * browser's autoplay policy, or by iPadOS backgrounding the tab).
 *
 * The one-shot alert can afford to call `ctx.resume()` and schedule in the
 * `.then()`. A repeating positional ping cannot: with the context suspended
 * every cycle would queue another pending resume, and they would all fire at
 * once the moment the user finally touches the page. Repeating callers skip
 * the ping instead and let `initAudioAlertUnlock` bring the context back.
 *
 * Returns false before the context has ever been created, so the very first
 * alert still gets to create and unlock it. Only "suspended" counts: a closed
 * context never comes back, and reporting it here would have the repeating
 * caller retry forever instead of failing once inside playAlertSound.
 */
export function isAudioAlertSuspended(): boolean {
  return audioContext !== null && audioContext.state === "suspended";
}

/**
 * Play one alert tone. `pan` is -1 (hard left) to +1 (hard right); the default
 * 0 keeps every existing caller centred and unchanged.
 */
export function playAlertSound(
  sound: AudioAlertSound,
  volume: number = 0.5,
  pan: number = 0,
): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === "suspended") {
      // Wait for the context to actually resume before scheduling oscillators,
      // otherwise the sound is lost because nodes are scheduled on a paused clock.
      ctx.resume().then(() => playSound(ctx, sound, volume, pan));
    } else {
      playSound(ctx, sound, volume, pan);
    }
  } catch {
    // Audio not supported
  }
}

// Two-tone chime (original sound)
function playChime(ctx: AudioContext, volume: number, pan: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  oscillator.onended = connectOut(ctx, gainNode, pan);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
  oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6

  // The peak is distance-dependent in positional mode, so it can be tiny.
  // exponentialRampToValueAtTime can never touch 0 and the tail must stay
  // BELOW the peak, otherwise a quiet far alert "decays" upward into a click.
  const peak = peakGain(volume, 0.6);
  gainNode.gain.setValueAtTime(peak, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    peak * 0.02,
    ctx.currentTime + 0.3,
  );

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}

// Simple ping sound
function playPing(ctx: AudioContext, volume: number, pan: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  oscillator.onended = connectOut(ctx, gainNode, pan);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    800,
    ctx.currentTime + 0.15,
  );

  const peak = peakGain(volume, 0.5);
  gainNode.gain.setValueAtTime(peak, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    peak * 0.02,
    ctx.currentTime + 0.15,
  );

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

// Beacon sound (repeating pulse)
function playBeacon(ctx: AudioContext, volume: number, pan: number): void {
  for (let i = 0; i < 2; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    oscillator.onended = connectOut(ctx, gainNode, pan);

    oscillator.type = "sine";
    const startTime = ctx.currentTime + i * 0.12;
    oscillator.frequency.setValueAtTime(1000, startTime);

    const peak = peakGain(volume, 0.5);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(peak * 0.02, startTime + 0.1);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  }
}

// Soft notification (gentle tone)
function playSoft(ctx: AudioContext, volume: number, pan: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  oscillator.onended = connectOut(ctx, gainNode, pan);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5

  const peak = peakGain(volume, 0.4);
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(
    peak * 0.02,
    ctx.currentTime + 0.4,
  );

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.4);
}

export const ALERT_SOUND_OPTIONS: {
  value: AudioAlertSound;
  label: string;
}[] = [
  { value: "chime", label: "Chime" },
  { value: "ping", label: "Ping" },
  { value: "beacon", label: "Beacon" },
  { value: "soft", label: "Soft" },
];

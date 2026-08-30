import { unlockDocumentScroll } from "@/lib/unlock-scroll";

type Listener = () => void;

let backgroundReady = false;
const backgroundListeners = new Set<Listener>();

let introComplete = false;
const introListeners = new Set<Listener>();

export function isBackgroundReady() {
  return backgroundReady;
}

export function markBackgroundReady() {
  if (backgroundReady) return;
  backgroundReady = true;
  backgroundListeners.forEach((fn) => fn());
  backgroundListeners.clear();
}

export function onBackgroundReady(listener: Listener) {
  if (backgroundReady) {
    listener();
    return () => {};
  }
  backgroundListeners.add(listener);
  return () => backgroundListeners.delete(listener);
}

export function isIntroComplete() {
  return introComplete;
}

export function markIntroComplete() {
  if (introComplete) return;
  introComplete = true;
  unlockDocumentScroll();
  introListeners.forEach((fn) => fn());
  introListeners.clear();
}

export function onIntroComplete(listener: Listener) {
  if (introComplete) {
    listener();
    return () => {};
  }
  introListeners.add(listener);
  return () => introListeners.delete(listener);
}

/** Dev / HMR — reset between hot reloads in development only */
export function resetIntroStateForDev() {
  if (process.env.NODE_ENV !== "development") return;
  backgroundReady = false;
  introComplete = false;
}

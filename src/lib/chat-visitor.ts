export type ChatDevice = "mobile" | "tablet" | "desktop";

export type ChatMessageMetadata = {
  device: ChatDevice;
};

/** Detect device class from viewport + user agent (client-only). */
export function detectChatDevice(): ChatDevice {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent;
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  const touch = navigator.maxTouchPoints > 1;

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (touch && !narrow && /Mac|Android/i.test(ua))) {
    return "tablet";
  }
  if (/Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(ua) || narrow) {
    return "mobile";
  }
  return "desktop";
}

export function buildMessageMetadata(): ChatMessageMetadata {
  return { device: detectChatDevice() };
}

export function deviceLabel(device: ChatDevice): string {
  switch (device) {
    case "mobile":
      return "Mobile";
    case "tablet":
      return "Tablet";
    default:
      return "Desktop";
  }
}

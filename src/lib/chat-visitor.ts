export type ChatDevice = "mobile" | "tablet" | "desktop";

export type ChatVisitorGeo = {
  city: string | null;
  region: string | null;
  country: string | null;
};

export type ChatMessageMetadata = {
  device: ChatDevice;
  location: string;
};

export type ChatVisitorContext = ChatVisitorGeo & {
  device: ChatDevice;
  locationLabel: string;
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

export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Local timezone";
  }
}

export function formatLocationLabel(geo: ChatVisitorGeo): string {
  const parts = [geo.city, geo.region, geo.country].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  if (parts.length > 0) return parts.join(", ");
  return getClientTimezone().replace(/_/g, " ");
}

export function buildMessageMetadata(
  context: ChatVisitorContext,
): ChatMessageMetadata {
  return {
    device: context.device,
    location: context.locationLabel,
  };
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

export async function fetchVisitorGeo(): Promise<ChatVisitorGeo> {
  try {
    const res = await fetch("/api/chat/context", { cache: "no-store" });
    if (!res.ok) throw new Error("context unavailable");
    const data = (await res.json()) as ChatVisitorGeo;
    return {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
}

export async function resolveVisitorContext(): Promise<ChatVisitorContext> {
  const geo = await fetchVisitorGeo();
  const device = detectChatDevice();
  return {
    ...geo,
    device,
    locationLabel: formatLocationLabel(geo),
  };
}

export type ChatDevice = "mobile" | "tablet" | "desktop";

export type LocationSource = "gps" | "ip" | "unknown";

export type ChatVisitorGeo = {
  city: string | null;
  region: string | null;
  country: string | null;
  source: LocationSource;
  local?: boolean;
};

export type ChatMessageMetadata = {
  device: ChatDevice;
  location: string;
};

export type ChatVisitorContext = ChatVisitorGeo & {
  device: ChatDevice;
  locationLabel: string;
};

const GPS_TIMEOUT_MS = 10_000;

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

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function formatLocationLabel(geo: ChatVisitorGeo): string {
  const parts = [geo.city, geo.region, geo.country].filter(
    (part): part is string => Boolean(part && part.trim()),
  );

  if (parts.length > 0) {
    const label = parts.join(", ");
    if (geo.source === "ip") return `${label} (approx.)`;
    return label;
  }

  if (geo.local || isLocalHost()) return "Local development";
  return "Location unknown";
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

async function fetchVisitorGeoFromIp(): Promise<ChatVisitorGeo> {
  try {
    const res = await fetch("/api/chat/context", { cache: "no-store" });
    if (!res.ok) throw new Error("context unavailable");
    const data = (await res.json()) as ChatVisitorGeo;
    return {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      source: data.source ?? "ip",
      local: data.local,
    };
  } catch {
    return {
      city: null,
      region: null,
      country: null,
      source: "unknown",
      local: isLocalHost(),
    };
  }
}

function fetchBrowserGeo(): Promise<ChatVisitorGeo | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `/api/chat/geocode?lat=${latitude}&lon=${longitude}`,
              { cache: "no-store" },
            );
            if (!res.ok) {
              resolve(null);
              return;
            }
            const data = (await res.json()) as ChatVisitorGeo;
            if (!data.city && !data.region && !data.country) {
              resolve(null);
              return;
            }
            resolve({
              city: data.city ?? null,
              region: data.region ?? null,
              country: data.country ?? null,
              source: "gps",
            });
          } catch {
            resolve(null);
          }
        })();
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: 60_000,
      },
    );
  });
}

/** GPS when permitted, otherwise IP-based estimate. Never uses timezone as a city. */
export async function resolveVisitorContext(): Promise<ChatVisitorContext> {
  const device = detectChatDevice();

  const gpsGeo = await fetchBrowserGeo();
  if (gpsGeo && (gpsGeo.city || gpsGeo.region)) {
    return {
      ...gpsGeo,
      device,
      locationLabel: formatLocationLabel(gpsGeo),
    };
  }

  const ipGeo = await fetchVisitorGeoFromIp();
  return {
    ...ipGeo,
    device,
    locationLabel: formatLocationLabel(ipGeo),
  };
}

/** Re-check location (e.g. after user grants GPS permission). */
export async function refreshVisitorContext(
  current: ChatVisitorContext | null,
): Promise<ChatVisitorContext> {
  const next = await resolveVisitorContext();
  if (
    current &&
    current.source === "gps" &&
    next.source !== "gps"
  ) {
    return current;
  }
  return next;
}

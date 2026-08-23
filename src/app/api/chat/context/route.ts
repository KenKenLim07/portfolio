import { NextResponse } from "next/server";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return req.headers.get("x-real-ip")?.trim() || "";
}

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  );
}

type IpApiResponse = {
  status?: string;
  city?: string;
  regionName?: string;
  country?: string;
  countryCode?: string;
};

async function lookupIpGeo(ip: string) {
  const res = await fetch(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,city,regionName,country,countryCode`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as IpApiResponse;
  if (data.status !== "success") return null;

  return {
    city: data.city?.trim() || null,
    region: data.regionName?.trim() || null,
    country: data.countryCode?.trim() || data.country?.trim() || null,
    source: "ip" as const,
  };
}

function geoFromEdgeHeaders(req: Request) {
  const { headers } = req;

  const city =
    headers.get("x-vercel-ip-city")?.trim() ||
    headers.get("cf-ipcity")?.trim() ||
    null;

  const region =
    headers.get("x-vercel-ip-country-region")?.trim() ||
    headers.get("cf-region")?.trim() ||
    null;

  const country =
    headers.get("x-vercel-ip-country")?.trim() ||
    headers.get("cf-ipcountry")?.trim() ||
    null;

  if (!city && !region && !country) return null;

  return { city, region, country, source: "ip" as const };
}

/** Coarse visitor location from IP (ip-api + edge headers). No raw IP returned. */
export async function GET(req: Request) {
  const ip = getClientIp(req);

  if (isPrivateIp(ip)) {
    return NextResponse.json({
      city: null,
      region: null,
      country: null,
      source: "unknown",
      local: true,
    });
  }

  try {
    const fromIpApi = await lookupIpGeo(ip);
    if (fromIpApi) return NextResponse.json(fromIpApi);
  } catch {
    // fall through to edge headers
  }

  const fromEdge = geoFromEdgeHeaders(req);
  if (fromEdge) return NextResponse.json(fromEdge);

  return NextResponse.json({
    city: null,
    region: null,
    country: null,
    source: "unknown",
    local: false,
  });
}

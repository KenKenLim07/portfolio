import { NextResponse } from "next/server";

const NOMINATIM_UA =
  "JoseMarieLimPortfolio/1.0 (portfolio chat; contact: josemarelim7@gmail.com)";

type NominatimAddress = {
  city?: string;
  town?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
  country_code?: string;
};

/** Reverse geocode GPS coordinates to city / region (accurate when user allows location). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Coordinates out of range." }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "10");

    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding unavailable." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { address?: NominatimAddress };
    const addr = data.address ?? {};

    const city =
      addr.city?.trim() ||
      addr.town?.trim() ||
      addr.municipality?.trim() ||
      addr.county?.trim() ||
      null;

    const region = addr.state?.trim() || addr.region?.trim() || null;
    const country =
      addr.country_code?.trim().toUpperCase() ||
      addr.country?.trim() ||
      null;

    return NextResponse.json({
      city,
      region,
      country,
      source: "gps",
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed." }, { status: 502 });
  }
}

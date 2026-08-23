import { NextResponse } from "next/server";

/** Coarse visitor location from edge headers (Vercel / Cloudflare). No raw IP exposed. */
export async function GET(req: Request) {
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

  return NextResponse.json({ city, region, country });
}

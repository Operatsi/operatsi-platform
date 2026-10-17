import { NextRequest, NextResponse } from "next/server";

interface DeviceMetadata {
  browser: string;
  os: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  ipAddress: string;
  location: string;
}

function parseUserAgent(ua: string): { browser: string; os: string; deviceType: "Desktop" | "Mobile" | "Tablet" } {
  const lower = ua.toLowerCase();

  // 1. Device Type
  let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(lower)) {
    deviceType = "Tablet";
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|windows phone/i.test(lower)) {
    deviceType = "Mobile";
  }

  // 2. Operating System
  let os = "Unknown OS";
  if (lower.includes("windows nt 10.0")) {
    os = "Windows 11 / 10";
  } else if (lower.includes("windows nt 6.3")) {
    os = "Windows 8.1";
  } else if (lower.includes("windows nt 6.1")) {
    os = "Windows 7";
  } else if (lower.includes("windows")) {
    os = "Windows";
  } else if (lower.includes("macintosh") || lower.includes("mac os x")) {
    os = "macOS";
  } else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) {
    os = "iOS";
  } else if (lower.includes("android")) {
    os = "Android";
  } else if (lower.includes("cros")) {
    os = "ChromeOS";
  } else if (lower.includes("linux")) {
    os = "Linux";
  }

  // 3. Browser
  let browser = "Web Browser";
  if (lower.includes("edg/")) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = match ? `Microsoft Edge ${match[1].split(".")[0]}` : "Microsoft Edge";
  } else if (lower.includes("opr/") || lower.includes("opera")) {
    const match = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
    browser = match ? `Opera ${match[1].split(".")[0]}` : "Opera";
  } else if (lower.includes("chrome/") && !lower.includes("edg/") && !lower.includes("opr/")) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = match ? `Google Chrome ${match[1].split(".")[0]}` : "Google Chrome";
  } else if (lower.includes("safari/") && !lower.includes("chrome/")) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = match ? `Apple Safari ${match[1].split(".")[0]}` : "Apple Safari";
  } else if (lower.includes("firefox/")) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = match ? `Mozilla Firefox ${match[1].split(".")[0]}` : "Mozilla Firefox";
  }

  return { browser, os, deviceType };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function getApproximateLocation(req: NextRequest, ip: string): string {
  // Check Cloud Provider Geolocation headers
  const city = req.headers.get("x-vercel-ip-city") || req.headers.get("cf-ipcity");
  const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry");
  const region = req.headers.get("x-vercel-ip-country-region");

  if (city && country) {
    return region ? `${decodeURIComponent(city)}, ${region}, ${country}` : `${decodeURIComponent(city)}, ${country}`;
  }
  if (country) {
    return country;
  }

  // Check if loopback or private IP
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return "Local Development Environment";
  }

  return "Location unavailable";
}

export async function GET(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const ipAddress = getClientIp(req);
  const { browser, os, deviceType } = parseUserAgent(ua);
  const location = getApproximateLocation(req, ipAddress);

  const metadata: DeviceMetadata = {
    browser,
    os,
    deviceType,
    ipAddress,
    location,
  };

  return NextResponse.json(metadata, { status: 200 });
}

export async function POST(req: NextRequest) {
  return GET(req);
}

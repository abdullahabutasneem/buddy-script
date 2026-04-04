import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:4000";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy feed post list and creation to the Express API.
 * Multipart POSTs are buffered and re-sent so the body is not corrupted
 * (Next.js rewrites are unreliable for multipart/form-data + multer).
 */
export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  let res: Response;
  try {
    res = await fetch(`${backendUrl}/api/posts`, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach API. Is the backend running?" },
      { status: 502 },
    );
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Use multipart/form-data to create a post (text and/or image)." },
      { status: 400 },
    );
  }

  let buf: ArrayBuffer;
  try {
    buf = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Could not read upload body" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl}/api/posts`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        "content-type": contentType,
      },
      body: Buffer.from(buf),
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach API. Is the backend running?" },
      { status: 502 },
    );
  }

  const out = await res.arrayBuffer();
  return new NextResponse(out, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

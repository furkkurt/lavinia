import { NextRequest, NextResponse } from "next/server";
import { handlePaytrCallbackPost } from "./handle-post";

/** Tarayıcı / panel doğrulaması GET ile denenirse 404 yerine 200 (yol doğru mu kontrolü). */
export async function GET() {
  return new NextResponse(
    "OK\nPayTR bildirimi POST (form) ile /api/paytr-callback adresine gelir.\n",
    {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}

export async function POST(request: NextRequest) {
  return handlePaytrCallbackPost(request);
}

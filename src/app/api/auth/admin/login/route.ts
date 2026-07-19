import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { setAdminSession } from "@/lib/session";
import type { AuthTokens } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await callBackend<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  await setAdminSession(result.data.access_token, result.data.refresh_token);

  return NextResponse.json({ ok: true });
}

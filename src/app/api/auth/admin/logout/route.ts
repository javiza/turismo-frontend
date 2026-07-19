import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { clearAdminSession, getSessionTokens } from "@/lib/session";

export async function POST() {
  const { adminAccess } = await getSessionTokens();

  if (adminAccess) {
    await callBackend("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminAccess}` },
    });
  }

  await clearAdminSession();

  return NextResponse.json({ ok: true });
}

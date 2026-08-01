import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await callBackend("/clientes-auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return NextResponse.json(result.data, { status: result.status });
}

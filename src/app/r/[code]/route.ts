import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate code format: 8 chars, alphanumeric
  if (!/^[a-zA-Z0-9]{8}$/.test(code)) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  return NextResponse.redirect(
    new URL(`/register?ref=${encodeURIComponent(code)}`, request.url)
  );
}

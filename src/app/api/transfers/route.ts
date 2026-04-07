import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";
import { TransferInviteEmail } from "@/emails/transfer-invite";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Nicht angemeldet" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, email, vehicleName } = body;

    if (!token || !email || !vehicleName) {
      return NextResponse.json(
        { error: "Fehlende Parameter" },
        { status: 400 }
      );
    }

    // Determine the base URL for the transfer link
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/+$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const transferUrl = `${origin}/transfer/${token}`;

    // Calculate expiry (14 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // Send email if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: "Oldtimer Docs <noreply@oldtimer-docs.com>",
          to: email,
          subject: `Fahrzeug-Transfer: ${vehicleName}`,
          react: TransferInviteEmail({
            vehicleName,
            transferUrl,
            expiresAt: expiresAt.toISOString(),
          }),
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the request — the link is the primary mechanism
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten des Transfers" },
      { status: 500 }
    );
  }
}

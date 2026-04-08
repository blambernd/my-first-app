import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";
import { MemberInviteEmail } from "@/emails/member-invite";
import { inviteMemberSchema, ROLE_LABELS } from "@/lib/validations/member";
import type { InviteRole } from "@/lib/validations/member";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params;
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

    // Verify user is the vehicle owner
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, make, model, year")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (!vehicle) {
      return NextResponse.json(
        { error: "Fahrzeug nicht gefunden oder keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Generate token and expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert invitation
    const { error: insertError } = await supabase
      .from("vehicle_invitations")
      .insert({
        vehicle_id: vehicleId,
        email: normalizedEmail,
        token,
        role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: "offen",
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Diese E-Mail wurde bereits eingeladen" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // Build invite URL
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/+$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const inviteUrl = `${origin}/invite/${token}`;
    const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    const roleLabel = ROLE_LABELS[role as InviteRole] || role;
    let emailSent = false;

    // Send email if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: "Oldtimer Docs <noreply@oldtimer-docs.com>",
          to: normalizedEmail,
          subject: `Einladung: ${vehicleName}`,
          react: MemberInviteEmail({
            vehicleName,
            role: roleLabel,
            inviteUrl,
            expiresAt: expiresAt.toISOString(),
          }),
        });
        emailSent = true;
      } catch {
        // Email failed, but invitation was created — user can still share link
      }
    }

    return NextResponse.json({
      success: true,
      inviteUrl,
      emailSent,
    });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Einladung" },
      { status: 500 }
    );
  }
}

// Resend invitation email
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params;
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

    // Verify user is the vehicle owner
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, make, model, year")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (!vehicle) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const { token, email, role } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "Fehlende Parameter" },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/+$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const inviteUrl = `${origin}/invite/${token}`;
    const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    const roleLabel = ROLE_LABELS[role as InviteRole] || role;

    if (!resend) {
      return NextResponse.json(
        { error: "E-Mail-Versand nicht konfiguriert" },
        { status: 500 }
      );
    }

    await resend.emails.send({
      from: "Oldtimer Docs <noreply@oldtimer-docs.com>",
      to: email,
      subject: `Erinnerung: Einladung zu ${vehicleName}`,
      react: MemberInviteEmail({
        vehicleName,
        role: roleLabel,
        inviteUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Senden der E-Mail" },
      { status: 500 }
    );
  }
}

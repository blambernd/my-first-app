import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const contactSchema = z.object({
  category: z.enum(["general", "improvement", "bug", "account"]),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  bugUrl: z.string().url().optional().or(z.literal("")),
});

const CATEGORY_LABELS: Record<string, string> = {
  general: "Allgemeine Anfrage",
  improvement: "Verbesserungsvorschlag",
  bug: "Bug melden",
  account: "Account / Datenschutz",
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > 5;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten.", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { category, name, email, subject, message, bugUrl } = result.data;
    const categoryLabel = CATEGORY_LABELS[category] ?? category;
    const contactEmail = process.env.CONTACT_EMAIL_TO;

    if (!resend || !contactEmail) {
      console.error("Missing RESEND_API_KEY or CONTACT_EMAIL_TO env variable");
      return NextResponse.json(
        { error: "Der E-Mail-Service ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut." },
        { status: 503 }
      );
    }

    await resend.emails.send({
      from: "Oldtimer Docs Kontakt <noreply@oldtimerdocs.de>",
      to: contactEmail,
      replyTo: email,
      subject: `[${categoryLabel}] ${subject}`,
      text: [
        `Kategorie: ${categoryLabel}`,
        `Name: ${name}`,
        `E-Mail: ${email}`,
        `Betreff: ${subject}`,
        bugUrl ? `Bug-URL: ${bugUrl}` : null,
        "",
        "Nachricht:",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}

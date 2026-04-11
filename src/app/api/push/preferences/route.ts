import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { z } from "zod";

// Rate limiting: max 20 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 20;
}

const preferencesSchema = z.object({
  reminder_days: z.number().refine((v) => [1, 7, 14, 30].includes(v)),
  tuv_enabled: z.boolean(),
  service_enabled: z.boolean(),
  email_enabled: z.boolean(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es in einer Minute erneut." },
      { status: 429 }
    );
  }

  const { data } = await supabase
    .from("notification_preferences")
    .select("reminder_days, tuv_enabled, service_enabled, email_enabled")
    .eq("user_id", user.id)
    .single();

  // Return defaults if no preferences exist yet
  return NextResponse.json(
    data || {
      reminder_days: 7,
      tuv_enabled: true,
      service_enabled: true,
      email_enabled: true,
    }
  );
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es in einer Minute erneut." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = preferencesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

/**
 * Einen abgeschlossenen Verkaufsvorgang ändern oder zurücknehmen (PROJ-38).
 *
 * Zwei Kriterien, die ohne diese Route unerfüllbar blieben:
 * „Ein Verkaufserlös kann auch nachträglich erfasst oder korrigiert werden"
 * und „Der Vorgang ist zurücknehmbar, solange das Fahrzeug noch existiert".
 *
 * Beide Zugriffe sind an das eigene Konto gebunden — zusätzlich zu den
 * Zugriffsregeln der Datenbank, die dasselbe noch einmal durchsetzen.
 */

const patchSchema = z.object({
  // `null` löscht den Erlös wieder; dann entfällt die Spanne, nicht der
  // Vorgang. Genau dafür ist die Angabe freiwillig.
  sale_price_eur: z.coerce.number().min(0).max(20_000_000).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { sale_price_eur } = parsed.data;

  const { data, error } = await supabase
    .from("dealer_sales")
    .update({
      sale_price_cents:
        sale_price_eur === null ? null : Math.round(sale_price_eur * 100),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Dealer sale update failed:", error.message);
    return NextResponse.json(
      { error: "Konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }

  // Kein Treffer heißt: fremder oder nicht vorhandener Vorgang. Beides
  // beantwortet dieselbe Meldung — wer raten will, ob eine fremde Kennung
  // existiert, soll das hier nicht erfahren.
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("dealer_sales")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Dealer sale delete failed:", error.message);
    return NextResponse.json(
      { error: "Konnte nicht zurückgenommen werden" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // Das Fahrzeug selbst bleibt unberührt — es kehrt allein dadurch in den
  // Bestand zurück, dass der Vorgang fort ist.
  return NextResponse.json({ ok: true });
}

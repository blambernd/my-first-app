import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

/**
 * Ein Fahrzeug als verkauft kennzeichnen (PROJ-38).
 *
 * Der zweite Weg aus dem Bestand, neben der Fahrzeugübergabe. Im Handel ist
 * der Käufer ohne Konto der Regelfall — ohne diesen Weg beschriebe die
 * Auswertung nur die Minderheit der Verkäufe.
 *
 * Geschrieben wird eine **Abschrift**: Marke, Modell, Baujahr, Kauf- und
 * Verkaufsdaten. Bewusst keine Fahrzeugkennung — der Vorgang soll das
 * Fahrzeug überleben, das später gelöscht oder übergeben werden kann.
 *
 * Die Fahrzeugakte bleibt unberührt. Ein Verkauf ist kein Grund, Belege
 * wegzuwerfen; ob das Fahrzeug bleibt, entscheidet der Händler getrennt.
 */
const schema = z.object({
  vehicle_id: z.string().uuid("Ungültige Fahrzeugkennung"),
  sold_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Verkaufsdatum muss JJJJ-MM-TT sein"),
  // Freiwillig: Ohne Erlös bleibt der Vorgang erhalten, nur die Spanne
  // entfällt. Erfunden wird nichts.
  sale_price_eur: z.coerce.number().min(0).max(20_000_000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { vehicle_id, sold_on, sale_price_eur } = parsed.data;

  // Das Fahrzeug muss dem Anfragenden gehören. Ohne diese Prüfung könnte
  // jeder Angemeldete fremde Fahrzeuge in seinen Bestand schreiben.
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year, currency, created_at")
    .eq("id", vehicle_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vehicle) {
    return NextResponse.json(
      { error: "Fahrzeug nicht gefunden" },
      { status: 404 }
    );
  }

  const { data: purchase } = await supabase
    .from("vehicle_purchases")
    .select("price_cents, purchased_on")
    .eq("vehicle_id", vehicle_id)
    .maybeSingle();

  const purchasedOn =
    purchase?.purchased_on ?? vehicle.created_at?.split("T")[0] ?? null;

  if (purchasedOn && sold_on < purchasedOn) {
    return NextResponse.json(
      { error: "Das Verkaufsdatum liegt vor dem Kaufdatum" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("dealer_sales").insert({
    user_id: user.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    currency: vehicle.currency,
    purchased_on: purchasedOn,
    purchase_price_cents: purchase?.price_cents ?? null,
    sold_on,
    sale_price_cents:
      sale_price_eur === undefined ? null : Math.round(sale_price_eur * 100),
    origin: "manual",
  });

  if (error) {
    console.error("Dealer sale insert failed:", error.message);
    return NextResponse.json(
      { error: "Konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

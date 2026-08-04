import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  buildCostCsv,
  exportFilename,
  formatDatum,
  type CsvRow,
} from "@/lib/transfer-costs";
import {
  PAYMENT_INTERVALS,
  RECURRING_COST_TYPES,
} from "@/lib/validations/recurring-cost";
import { ONE_OFF_COST_TYPES } from "@/lib/validations/one-off-cost";
import { getEntryTypeLabel } from "@/lib/validations/service-entry";

/**
 * Kostendaten als Tabelle sichern, bevor sie beim Transfer entfernt werden
 * (PROJ-32).
 *
 * **Ausschließlich für den aktuellen Besitzer.** Das ist keine Formalie: Ein
 * Export ist genau der Weg, über den Kostendaten das System verlassen sollen —
 * er darf nicht zugleich der Weg werden, über den sie es unbefugt tun. Deshalb
 * die Besitzerprüfung direkt an der Fahrzeugzeile, nicht bloß der Verlass auf
 * die Zugriffsregeln der einzelnen Tabellen.
 *
 * Der Export enthält **nur, was entfernt wird** — er ist das Gegenstück zum
 * Verlust, keine allgemeine Kostenübersicht.
 *
 * Keine Obergrenze auf den Abfragen: Bei einer Restaurierung sind mehrere
 * hundert Positionen realistisch, und ein abgeschnittener Export wäre
 * schlimmer als keiner, weil der Verlust dann unbemerkt bliebe.
 */
export async function GET(
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

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Kein 403: Wer nicht Besitzer ist, soll nicht einmal erfahren, dass es das
  // Fahrzeug gibt — dieselbe Linie wie im übrigen Kostenbereich.
  if (!vehicle) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const [purchase, extras, recurring, oneOff, marketValues, service, fuel] =
    await Promise.all([
      supabase
        .from("vehicle_purchases")
        .select("price_cents, purchased_on, notes")
        .eq("vehicle_id", id)
        .maybeSingle(),
      supabase
        .from("vehicle_purchase_costs")
        .select("label, amount_cents")
        .eq("vehicle_id", id),
      supabase
        .from("recurring_costs")
        .select("cost_type, amount_cents, payment_interval, valid_from, valid_to, provider, notes")
        .eq("vehicle_id", id)
        .order("valid_from", { ascending: true }),
      supabase
        .from("one_off_costs")
        .select("cost_type, description, amount_cents, purchased_at, notes")
        .eq("vehicle_id", id)
        .order("purchased_at", { ascending: true }),
      supabase
        .from("vehicle_market_values")
        .select("value_cents, valued_on, note")
        .eq("vehicle_id", id)
        .order("valued_on", { ascending: true }),
      supabase
        .from("service_entries")
        .select("service_date, entry_type, description, cost_cents, workshop_name")
        .eq("vehicle_id", id)
        .not("cost_cents", "is", null)
        .order("service_date", { ascending: true }),
      supabase
        .from("fuel_entries")
        .select("fueled_at, cost_cents, liters, station")
        .eq("vehicle_id", id)
        .order("fueled_at", { ascending: true }),
    ]);

  const rows: CsvRow[] = [];

  if (purchase.data) {
    rows.push({
      bereich: "Anschaffung",
      datum: purchase.data.purchased_on ?? "",
      bezeichnung: "Kaufpreis",
      amountCents: purchase.data.price_cents,
      anmerkung: purchase.data.notes ?? "",
    });
  }
  for (const e of extras.data ?? []) {
    rows.push({
      bereich: "Anschaffung",
      datum: purchase.data?.purchased_on ?? "",
      bezeichnung: e.label,
      amountCents: e.amount_cents,
      anmerkung: "Kauf-Nebenkosten",
    });
  }
  for (const m of marketValues.data ?? []) {
    rows.push({
      bereich: "Wertentwicklung",
      datum: m.valued_on ?? "",
      bezeichnung: "Eingetragener Marktwert",
      amountCents: m.value_cents,
      anmerkung: m.note ?? "",
    });
  }
  for (const r of recurring.data ?? []) {
    rows.push({
      bereich: "Laufende Kosten",
      datum: r.valid_from ?? "",
      bezeichnung: label(RECURRING_COST_TYPES, r.cost_type),
      amountCents: r.amount_cents,
      anmerkung: [
        // Beschriftungen und Datumsangaben deutsch — eine Tabelle, in der
        // „yearly" neben „jährlich" und „2027-01-01" neben „01.06.2023"
        // steht, sieht nach halb fertiger Übersetzung aus.
        r.payment_interval
          ? `Intervall: ${label(PAYMENT_INTERVALS, r.payment_interval)}`
          : "",
        r.provider ? `Anbieter: ${r.provider}` : "",
        r.valid_to ? `gültig bis ${formatDatum(r.valid_to)}` : "",
        r.notes ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  for (const o of oneOff.data ?? []) {
    rows.push({
      bereich: "Einzelkosten",
      datum: o.purchased_at ?? "",
      bezeichnung: o.description || label(ONE_OFF_COST_TYPES, o.cost_type),
      amountCents: o.amount_cents,
      anmerkung: [label(ONE_OFF_COST_TYPES, o.cost_type), o.notes ?? ""]
        .filter(Boolean)
        .join(" · "),
    });
  }
  for (const s of service.data ?? []) {
    rows.push({
      bereich: "Scheckheft",
      datum: s.service_date ?? "",
      bezeichnung: s.description || getEntryTypeLabel(s.entry_type),
      amountCents: s.cost_cents ?? 0,
      anmerkung: [
        getEntryTypeLabel(s.entry_type),
        s.workshop_name ?? "",
        "Eintrag bleibt erhalten, nur der Betrag wird entfernt",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  for (const f of fuel.data ?? []) {
    rows.push({
      bereich: "Tankbuch",
      datum: f.fueled_at ?? "",
      bezeichnung: `Tankvorgang${f.liters ? ` (${f.liters} l)` : ""}`,
      amountCents: f.cost_cents ?? 0,
      anmerkung: [
        f.station ?? "",
        "Eintrag bleibt erhalten, nur der Betrag wird entfernt",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
  const csv = buildCostCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(vehicleName, new Date())}"`,
      // Kostendaten gehören nicht in einen Zwischenspeicher
      "Cache-Control": "no-store",
    },
  });
}

function label(
  typen: ReadonlyArray<{ value: string; label: string }>,
  wert: string
): string {
  return typen.find((t) => t.value === wert)?.label ?? wert;
}

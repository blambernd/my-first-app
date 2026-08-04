import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  saleReportSchema,
  type SaleReportInput,
} from "@/lib/validations/sale-report";

/**
 * Übergabe annehmen — samt Kaufpreis und Einwilligung (PROJ-33).
 *
 * Die Angaben gehen mit dem Annehmen zusammen an die Datenbankfunktion, damit
 * Besitzerwechsel, Entfernen der Kostendaten (PROJ-32) und der neue Datenpunkt
 * in **einer** Transaktion entstehen. Ein halb fertiger Zustand kann so gar
 * nicht erst auftreten.
 *
 * Die Plausibilitätsprüfung in der Datenbankfunktion ist die maßgebliche: Die
 * Prüfung im Formular ist Bequemlichkeit, kein Schutz.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Die Angaben sind freiwillig. Ein fehlender oder unlesbarer Rumpf — etwa
  // von einem älteren Browserstand — darf die Übergabe nicht verhindern.
  let angaben: SaleReportInput = { share_anonymously: false };
  try {
    const geprueft = saleReportSchema.safeParse(await request.json());
    if (!geprueft.success) {
      return NextResponse.json(
        { error: geprueft.error.issues[0]?.message ?? "Ungültige Angabe" },
        { status: 400 }
      );
    }
    angaben = geprueft.data;
  } catch {
    // Kein Rumpf: annehmen ohne Angaben
  }

  // Call the atomic RPC function
  const { data, error } = await supabase.rpc("accept_vehicle_transfer", {
    p_token: token,
    p_price_cents:
      angaben.purchase_price_eur === undefined
        ? null
        : Math.round(angaben.purchase_price_eur * 100),
    p_condition_grade: angaben.condition_grade ?? null,
    p_mileage_km: angaben.mileage_km ?? null,
    p_share: angaben.share_anonymously === true,
  });

  if (error) {
    console.error("Transfer accept RPC error:", error);
    return NextResponse.json(
      { error: "Fehler beim Annehmen des Transfers" },
      { status: 500 }
    );
  }

  const result = data as { error?: string; success?: boolean; vehicleId?: string };

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    vehicleId: result.vehicleId,
  });
}

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { VehicleGallery, type GalleryImage } from "@/components/vehicle-gallery";
import { VehiclePurchaseSection } from "@/components/vehicle-purchase-section";
import {
  getConditionGradeLabel,
  type VehicleWithImages,
} from "@/lib/validations/vehicle";
import {
  normalizePurchase,
  normalizeExtraCost,
  type PurchaseExtraCost,
  type VehiclePurchase,
  type VehiclePurchaseWithCosts,
} from "@/lib/validations/vehicle-purchase";

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

interface SpecItem {
  label: string;
  value: string | null;
  /** Kennungen wie die FIN lesen sich in Festbreite deutlich besser. */
  mono?: boolean;
}

function getImageUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

function SpecGroup({ title, items }: { title: string; items: SpecItem[] }) {
  return (
    <section>
      <h2 className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60 mb-2">
        {title}
      </h2>
      <dl className="divide-y divide-border/40">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline justify-between gap-4 py-2"
          >
            <dt className="text-xs text-muted-foreground/70 shrink-0">
              {item.label}
            </dt>
            <dd
              className={
                item.mono
                  ? "text-xs font-mono text-right break-all"
                  : "text-sm font-medium text-right"
              }
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Try owner first, then member
  let vehicle = (
    await supabase
      .from("vehicles")
      .select("*, vehicle_images(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
  ).data;

  let isOwner = Boolean(vehicle);

  if (!vehicle) {
    // Check membership
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id, vehicles(*, vehicle_images(*))")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (membership?.vehicles) {
      vehicle = membership.vehicles as unknown as VehicleWithImages & Record<string, unknown>;
      isOwner = false;
    }
  }

  if (!vehicle) {
    notFound();
  }

  const typedVehicle = vehicle as VehicleWithImages;

  // Anschaffung: ausschließlich für den Besitzer geladen. Die Regeln in der
  // Datenbank setzen dasselbe durch — hier wird gar nicht erst gefragt, damit
  // der Kaufpreis auch nicht versehentlich in die Seitenantwort gerät.
  let purchase: VehiclePurchaseWithCosts | null = null;
  let purchaseMilestoneDate: string | null = null;

  if (isOwner) {
    const [{ data: purchaseRow }, { data: kaufMilestone }] = await Promise.all([
      supabase.from("vehicle_purchases").select("*").eq("vehicle_id", id).maybeSingle(),
      supabase
        .from("vehicle_milestones")
        .select("milestone_date")
        .eq("vehicle_id", id)
        .eq("category", "kauf")
        .order("milestone_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    purchaseMilestoneDate = kaufMilestone?.milestone_date ?? null;

    if (purchaseRow) {
      const normalized = normalizePurchase(purchaseRow as VehiclePurchase);
      const { data: extraRows } = await supabase
        .from("vehicle_purchase_costs")
        .select("*")
        .eq("purchase_id", normalized.id)
        .order("created_at", { ascending: true });
      purchase = {
        ...normalized,
        extraCosts: ((extraRows ?? []) as PurchaseExtraCost[]).map(
          normalizeExtraCost
        ),
      };
    }
  }

  // Das Hauptbild eröffnet die Galerie, der Rest folgt in gepflegter Reihenfolge.
  const galleryImages: GalleryImage[] = [...(typedVehicle.vehicle_images ?? [])]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.position - b.position;
    })
    .map((img) => ({
      id: img.id,
      url: getImageUrl(img.storage_path, supabaseUrl),
    }));

  const vehicleName = `${typedVehicle.make} ${typedVehicle.model}`;

  // Marke und Modell stehen bereits als Überschrift im Layout und werden hier
  // bewusst nicht wiederholt.
  const groups: Array<{ title: string; items: SpecItem[] }> = [
    {
      title: "Identität",
      items: [
        {
          label: "Erstzulassung",
          value: typedVehicle.first_registration_date
            ? new Date(typedVehicle.first_registration_date).toLocaleDateString("de-DE")
            : `${typedVehicle.year}`,
        },
        { label: "Werksbezeichnung", value: typedVehicle.factory_code },
        { label: "FIN", value: typedVehicle.vin, mono: true },
        { label: "Kennzeichen", value: typedVehicle.license_plate },
      ],
    },
    {
      title: "Technik",
      items: [
        { label: "Motortyp", value: typedVehicle.engine_type },
        {
          label: "Hubraum",
          value: typedVehicle.displacement_ccm
            ? `${typedVehicle.displacement_ccm.toLocaleString("de-DE")} ccm`
            : null,
        },
        {
          label: "Leistung",
          value: typedVehicle.horsepower ? `${typedVehicle.horsepower} PS` : null,
        },
        {
          label: "Laufleistung",
          value: typedVehicle.mileage_km
            ? `${typedVehicle.mileage_km.toLocaleString("de-DE")} km`
            : null,
        },
        { label: "Farbe", value: typedVehicle.color },
        {
          label: "Zustand",
          value: getConditionGradeLabel(typedVehicle.condition_grade),
        },
      ],
    },
    {
      title: "Versicherung",
      items: [
        { label: "Gesellschaft", value: typedVehicle.insurance_company },
        { label: "Police", value: typedVehicle.insurance_policy_number, mono: true },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((i) => i.value) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:gap-10">
      <div className="lg:col-span-3">
        <VehicleGallery images={galleryImages} vehicleName={vehicleName} />
      </div>

      <div className="lg:col-span-2 space-y-6">
        {isOwner && (
          <VehiclePurchaseSection
            vehicleId={id}
            purchase={purchase}
            milestoneDate={purchaseMilestoneDate}
          />
        )}

        {groups.length > 0 ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <SpecGroup key={group.title} title={group.title} items={group.items} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
            <p className="text-sm font-medium">Noch keine Fahrzeugdaten</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ergänze Werksbezeichnung, Motor und Laufleistung, damit das Profil
              vollständig ist.
            </p>
            {isOwner && (
              <Link
                href={`/vehicles/${id}/edit`}
                className="inline-block mt-3 text-xs font-medium text-primary underline underline-offset-4"
              >
                Fahrzeugdaten ergänzen
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

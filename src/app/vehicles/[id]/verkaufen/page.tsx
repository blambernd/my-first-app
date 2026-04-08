import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ListingEditor } from "@/components/listing-editor";

interface VerkaufenPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerkaufenPage({ params }: VerkaufenPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch vehicle with all needed data
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(
      "id, make, model, year, factory_code, color, engine_type, displacement_ccm, horsepower, mileage_km"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
  }

  // Fetch vehicle images, profile, and market analysis in parallel
  const [
    vehicleImagesResult,
    profileResult,
    marketAnalysisResult,
  ] = await Promise.all([
    supabase
      .from("vehicle_images")
      .select("id, storage_path, position")
      .eq("vehicle_id", id)
      .order("position"),
    supabase
      .from("vehicle_profiles")
      .select("token, is_active")
      .eq("vehicle_id", id)
      .single(),
    supabase
      .from("market_analyses")
      .select(
        "recommended_price_low, recommended_price_high, median_price, status"
      )
      .eq("vehicle_id", id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Fetch milestone images via milestones (proper join)
  const { data: milestonesWithImages } = await supabase
    .from("vehicle_milestones")
    .select("vehicle_milestone_images(id, storage_path, caption)")
    .eq("vehicle_id", id);

  const vehiclePhotos = (vehicleImagesResult.data || []).map((img, i) => ({
    id: img.id,
    storage_path: img.storage_path,
    label: `Foto ${img.position + 1}`,
    source: "vehicle" as const,
  }));

  const milestonePhotos: {
    id: string;
    storage_path: string;
    label: string;
    source: "milestone";
  }[] = [];
  if (milestonesWithImages) {
    for (const milestone of milestonesWithImages) {
      const images = milestone.vehicle_milestone_images as {
        id: string;
        storage_path: string;
        caption: string | null;
      }[];
      if (images) {
        for (const img of images) {
          milestonePhotos.push({
            id: img.id,
            storage_path: img.storage_path,
            label: img.caption || "Historie-Bild",
            source: "milestone",
          });
        }
      }
    }
  }

  const allPhotos = [...vehiclePhotos, ...milestonePhotos];

  const profile = profileResult.data;
  const marketAnalysis = marketAnalysisResult.data;

  return (
    <ListingEditor
      vehicleId={id}
      vehicleData={{
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        factory_code: vehicle.factory_code,
        color: vehicle.color,
        engine_type: vehicle.engine_type,
        displacement_ccm: vehicle.displacement_ccm,
        horsepower: vehicle.horsepower,
        mileage_km: vehicle.mileage_km,
      }}
      photos={allPhotos}
      hasKurzprofil={!!profile?.is_active}
      kurzprofilToken={profile?.token || null}
      marketPrice={
        marketAnalysis
          ? {
              recommended_price_low: marketAnalysis.recommended_price_low,
              recommended_price_high: marketAnalysis.recommended_price_high,
              median_price: marketAnalysis.median_price,
            }
          : null
      }
    />
  );
}

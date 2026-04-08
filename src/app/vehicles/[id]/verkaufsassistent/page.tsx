import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SalesWizard } from "@/components/sales-wizard";

interface VerkaufsassistentPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerkaufsassistentPage({
  params,
}: VerkaufsassistentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only owners can access (not members)
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

  // Fetch all data for all steps in parallel
  const [
    vehicleImagesResult,
    serviceEntriesResult,
    milestonesResult,
    documentsResult,
    profileResult,
    marketAnalysisResult,
    listingResult,
  ] = await Promise.all([
    // Step 2 + 3: Images
    supabase
      .from("vehicle_images")
      .select("id, storage_path, position")
      .eq("vehicle_id", id)
      .order("position"),
    // Step 2: Service entries
    supabase
      .from("service_entries")
      .select("id, description, service_date")
      .eq("vehicle_id", id)
      .order("service_date", { ascending: false }),
    // Step 2: Milestones
    supabase
      .from("vehicle_milestones")
      .select("id, title, milestone_date")
      .eq("vehicle_id", id)
      .order("milestone_date", { ascending: false }),
    // Step 2: Documents
    supabase
      .from("vehicle_documents")
      .select("id, title, category")
      .eq("vehicle_id", id)
      .order("document_date", { ascending: false }),
    // Step 2 + 3: Profile
    supabase
      .from("vehicle_profiles")
      .select("token, is_active")
      .eq("vehicle_id", id)
      .single(),
    // Step 1 + 3: Market analysis
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
    // Step 3 + 4: Listing
    supabase
      .from("vehicle_listings")
      .select("*")
      .eq("vehicle_id", id)
      .single(),
  ]);

  // Fetch milestone images via milestones (for step 3 photos)
  const { data: milestonesWithImages } = await supabase
    .from("vehicle_milestones")
    .select("vehicle_milestone_images(id, storage_path, caption)")
    .eq("vehicle_id", id);

  const vehiclePhotos = (vehicleImagesResult.data || []).map((img) => ({
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
  const listing = listingResult.data;

  // Determine step completion from DB state
  const initialCompletion = {
    hasMarketAnalysis: !!marketAnalysis,
    hasProfile: !!profile?.is_active,
    hasListing: !!listing?.title,
    hasPublished: !!(
      listing?.published_platforms &&
      Array.isArray(listing.published_platforms) &&
      listing.published_platforms.some(
        (p: { status: string }) => p.status === "aktiv"
      )
    ),
  };

  return (
    <SalesWizard
      vehicleId={id}
      // Step 1
      vehicleMake={vehicle.make}
      vehicleModel={vehicle.model}
      vehicleYear={vehicle.year}
      vehicleFactoryCode={vehicle.factory_code}
      vehicleMileageKm={vehicle.mileage_km}
      // Step 2
      images={vehicleImagesResult.data || []}
      serviceEntries={serviceEntriesResult.data || []}
      milestones={milestonesResult.data || []}
      documents={documentsResult.data || []}
      // Step 3
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
      // Completion state
      initialCompletion={initialCompletion}
    />
  );
}

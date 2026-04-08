import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import JSZip from "jszip";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { data: listing } = await supabase
    .from("vehicle_listings")
    .select("selected_photo_ids, photo_order")
    .eq("vehicle_id", vehicleId)
    .single();

  if (!listing || listing.selected_photo_ids.length === 0) {
    return NextResponse.json(
      { error: "Keine Fotos ausgewählt" },
      { status: 404 }
    );
  }

  const photoIds: string[] = listing.selected_photo_ids;
  const photoOrder: string[] = listing.photo_order || [];

  // Fetch storage paths from both vehicle_images and vehicle_milestone_images
  const [vehicleImagesResult, milestoneImagesResult] = await Promise.all([
    supabase
      .from("vehicle_images")
      .select("id, storage_path")
      .in("id", photoIds),
    supabase
      .from("vehicle_milestone_images")
      .select("id, storage_path")
      .in("id", photoIds),
  ]);

  const imageMap = new Map<string, string>();
  for (const img of vehicleImagesResult.data || []) {
    imageMap.set(img.id, img.storage_path);
  }
  for (const img of milestoneImagesResult.data || []) {
    imageMap.set(img.id, img.storage_path);
  }

  // Order photos: use photo_order if available, otherwise keep original order
  const orderedIds =
    photoOrder.length > 0
      ? photoOrder.filter((id) => imageMap.has(id))
      : photoIds.filter((id) => imageMap.has(id));

  const zip = new JSZip();

  // Download each photo and add to ZIP
  const downloadPromises = orderedIds.map(async (photoId, index) => {
    const storagePath = imageMap.get(photoId);
    if (!storagePath) return;

    const { data, error } = await supabase.storage
      .from("vehicle-images")
      .download(storagePath);

    if (error || !data) return;

    const ext = storagePath.split(".").pop() || "jpg";
    const fileName = `${String(index + 1).padStart(2, "0")}_inserat.${ext}`;
    zip.file(fileName, await data.arrayBuffer());
  });

  await Promise.all(downloadPromises);

  if (Object.keys(zip.files).length === 0) {
    return NextResponse.json(
      { error: "Keine Fotos konnten geladen werden" },
      { status: 500 }
    );
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="inserat-fotos.zip"',
    },
  });
}

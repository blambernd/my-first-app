import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import JSZip from "jszip";

export async function POST(
  request: NextRequest,
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

  // Verify ownership or membership
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!ownedVehicle) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  const body = await request.json();
  const documentIds: string[] = body.documentIds ?? [];
  const milestoneImageIds: string[] = body.milestoneImageIds ?? [];
  const all: boolean = body.all === true;

  if (!all && documentIds.length === 0 && milestoneImageIds.length === 0) {
    return NextResponse.json(
      { error: "Keine Dokumente ausgewählt" },
      { status: 400 }
    );
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  function uniqueName(name: string): string {
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.substring(0, dot) : name;
    const ext = dot > 0 ? name.substring(dot) : "";
    let i = 2;
    while (usedNames.has(`${base}_${i}${ext}`)) i++;
    const unique = `${base}_${i}${ext}`;
    usedNames.add(unique);
    return unique;
  }

  // Fetch and add vehicle documents
  let docsQuery = supabase
    .from("vehicle_documents")
    .select("id, storage_path, file_name")
    .eq("vehicle_id", vehicleId);

  if (!all && documentIds.length > 0) {
    docsQuery = docsQuery.in("id", documentIds);
  }

  const { data: docs } = all || documentIds.length > 0 ? await docsQuery : { data: [] };

  const docPromises = (docs ?? []).map(async (doc) => {
    const { data, error } = await supabase.storage
      .from("vehicle-documents")
      .download(doc.storage_path);
    if (error || !data) return;
    zip.file(uniqueName(doc.file_name), await data.arrayBuffer());
  });

  // Fetch milestone images (joined through milestones for vehicle_id filtering)
  let milestoneImages: { id: string; storage_path: string }[] = [];
  if (all || milestoneImageIds.length > 0) {
    if (all) {
      // Get all milestone IDs for this vehicle, then fetch their images
      const { data: vehicleMilestones } = await supabase
        .from("vehicle_milestones")
        .select("id")
        .eq("vehicle_id", vehicleId);
      const milestoneIds = (vehicleMilestones ?? []).map((m) => m.id);
      if (milestoneIds.length > 0) {
        const { data } = await supabase
          .from("vehicle_milestone_images")
          .select("id, storage_path")
          .in("milestone_id", milestoneIds);
        milestoneImages = data ?? [];
      }
    } else {
      const { data } = await supabase
        .from("vehicle_milestone_images")
        .select("id, storage_path")
        .in("id", milestoneImageIds);
      milestoneImages = data ?? [];
    }
  }

  const imgPromises = (milestoneImages ?? []).map(async (img) => {
    const { data, error } = await supabase.storage
      .from("vehicle-images")
      .download(img.storage_path);
    if (error || !data) return;
    const ext = img.storage_path.split(".").pop() || "jpg";
    zip.file(uniqueName(`historie_${img.id.substring(0, 8)}.${ext}`), await data.arrayBuffer());
  });

  await Promise.all([...docPromises, ...imgPromises]);

  if (Object.keys(zip.files).length === 0) {
    return NextResponse.json(
      { error: "Keine Dateien konnten geladen werden" },
      { status: 500 }
    );
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="dokumente.zip"',
    },
  });
}

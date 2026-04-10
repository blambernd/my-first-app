import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string; msId: string }> };

/**
 * DELETE /api/vehicles/[id]/milestones/[msId]
 * Delete a milestone and all associated images + documents from storage.
 * Uses server-side Supabase client to bypass RLS for storage cleanup.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id: vehicleId, msId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Verify the user owns the vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    // Check if user is a member with edit rights
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("role")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role === "viewer") {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  // Verify milestone belongs to this vehicle
  const { data: milestone } = await supabase
    .from("vehicle_milestones")
    .select("id")
    .eq("id", msId)
    .eq("vehicle_id", vehicleId)
    .single();

  if (!milestone) {
    return NextResponse.json(
      { error: "Meilenstein nicht gefunden" },
      { status: 404 }
    );
  }

  // Fetch all associated images and documents
  const [{ data: images }, { data: documents }] = await Promise.all([
    supabase
      .from("vehicle_milestone_images")
      .select("id, storage_path")
      .eq("milestone_id", msId),
    supabase
      .from("vehicle_documents")
      .select("id, storage_path")
      .eq("milestone_id", msId),
  ]);

  // Delete files from storage buckets
  const imagePaths = (images ?? [])
    .map((img) => img.storage_path)
    .filter(Boolean);
  const docPaths = (documents ?? [])
    .map((doc) => doc.storage_path)
    .filter(Boolean);

  await Promise.all([
    imagePaths.length > 0
      ? supabase.storage.from("vehicle-images").remove(imagePaths)
      : Promise.resolve(),
    docPaths.length > 0
      ? supabase.storage.from("vehicle-documents").remove(docPaths)
      : Promise.resolve(),
  ]);

  // Delete DB rows explicitly (in case CASCADE is not set)
  await Promise.all([
    images && images.length > 0
      ? supabase
          .from("vehicle_milestone_images")
          .delete()
          .eq("milestone_id", msId)
      : Promise.resolve(),
    documents && documents.length > 0
      ? supabase
          .from("vehicle_documents")
          .delete()
          .eq("milestone_id", msId)
      : Promise.resolve(),
  ]);

  // Delete the milestone itself
  const { error } = await supabase
    .from("vehicle_milestones")
    .delete()
    .eq("id", msId);

  if (error) {
    console.error("Milestone delete error:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Meilensteins" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

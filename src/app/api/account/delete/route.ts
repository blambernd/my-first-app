import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server-Konfiguration fehlt" },
      { status: 500 }
    );
  }

  const adminClient = createServiceClient(url, serviceKey);

  try {
    // 1. Delete storage files (vehicle images + documents)
    const { data: vehicles } = await adminClient
      .from("vehicles")
      .select("id")
      .eq("user_id", user.id);

    if (vehicles && vehicles.length > 0) {
      const vehicleIds = vehicles.map((v) => v.id);

      // Delete vehicle images from storage
      const { data: images } = await adminClient
        .from("vehicle_images")
        .select("storage_path")
        .in("vehicle_id", vehicleIds);

      if (images && images.length > 0) {
        await adminClient.storage
          .from("vehicle-images")
          .remove(images.map((i) => i.storage_path));
      }

      // Delete milestone images from storage
      const { data: milestoneImages } = await adminClient
        .from("vehicle_milestone_images")
        .select("storage_path, vehicle_milestones!inner(vehicle_id)")
        .in("vehicle_milestones.vehicle_id", vehicleIds);

      if (milestoneImages && milestoneImages.length > 0) {
        await adminClient.storage
          .from("vehicle-images")
          .remove(milestoneImages.map((i) => i.storage_path));
      }

      // Delete documents from storage
      const { data: docs } = await adminClient
        .from("vehicle_documents")
        .select("storage_path")
        .in("vehicle_id", vehicleIds);

      if (docs && docs.length > 0) {
        await adminClient.storage
          .from("vehicle-documents")
          .remove(docs.map((d) => d.storage_path));
      }
    }

    // 2. Remove user's memberships in other vehicles
    await adminClient
      .from("vehicle_members")
      .delete()
      .eq("user_id", user.id);

    // 3. Delete user's vehicles (CASCADE removes entries, milestones, documents, etc.)
    await adminClient.from("vehicles").delete().eq("user_id", user.id);

    // 4. Delete the auth user via admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Löschen des Accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Accounts" },
      { status: 500 }
    );
  }
}

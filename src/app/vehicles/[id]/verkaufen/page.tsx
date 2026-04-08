import { redirect } from "next/navigation";

interface VerkaufenPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerkaufenPage({ params }: VerkaufenPageProps) {
  const { id } = await params;
  redirect(`/vehicles/${id}/verkaufsassistent?schritt=3`);
}

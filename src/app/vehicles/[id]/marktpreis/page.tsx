import { redirect } from "next/navigation";

interface MarktpreisPageProps {
  params: Promise<{ id: string }>;
}

export default async function MarktpreisPage({ params }: MarktpreisPageProps) {
  const { id } = await params;
  redirect(`/vehicles/${id}/verkaufsassistent?schritt=1`);
}
